-- Phase 4: Test chalana aur Scoring SIRF server (database function) par.
-- Student ko sahi uttar (correct_index) kabhi nahi milta, jab tak test submit na ho jaye.

-- Questions badalte hi Test ke total marks apne aap sahi ho jayen
create or replace function public.recalc_test_marks() returns trigger
language plpgsql security definer set search_path = public as $$
declare t uuid := case when tg_op = 'DELETE' then old.test_id else new.test_id end;
begin
  update public.mock_tests set total_marks = coalesce((select sum(marks) from public.questions where test_id = t), 0) where id = t;
  return null;
end $$;
create trigger questions_recalc after insert or update or delete on public.questions
  for each row execute function public.recalc_test_marks();

-- Sawal bina sahi uttar ke
create or replace function public.get_test_questions(p_test_id uuid)
returns table (id uuid, question_text text, options jsonb, marks numeric, sort_order int)
language sql stable security definer set search_path = public as $$
  select q.id, q.question_text, q.options, q.marks, q.sort_order
  from public.questions q join public.mock_tests t on t.id = q.test_id
  where q.test_id = p_test_id and t.is_published and auth.uid() is not null
  order by q.sort_order, q.created_at;
$$;

-- Test shuru (agar pehle se chal raha ho to wahi wapas)
create or replace function public.start_attempt(p_test_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Login zaroori hai'; end if;
  if not exists (select 1 from public.mock_tests where id = p_test_id and is_published) then
    raise exception 'Test uplabdh nahi hai';
  end if;
  select id into v_id from public.test_attempts
    where user_id = auth.uid() and test_id = p_test_id and status = 'in_progress'
    order by started_at desc limit 1;
  if v_id is null then
    insert into public.test_attempts (user_id, test_id) values (auth.uid(), p_test_id) returning id into v_id;
  end if;
  return v_id;
end $$;

-- Submit + Scoring. p_answers = {"<question_id>": <option_index>}
create or replace function public.submit_attempt(p_attempt_id uuid, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a public.test_attempts; t public.mock_tests; q public.questions;
  v_score numeric := 0; v_total numeric := 0; v_correct int := 0; v_wrong int := 0; v_skip int := 0;
  sel int; late boolean;
begin
  select * into a from public.test_attempts where id = p_attempt_id and user_id = auth.uid() for update;
  if not found then raise exception 'Attempt nahi mila'; end if;
  if a.status = 'submitted' then
    return jsonb_build_object('attempt_id', a.id, 'score', a.score);
  end if;
  select * into t from public.mock_tests where id = a.test_id;
  late := now() > a.started_at + make_interval(mins => t.duration_minutes) + interval '5 minutes';

  for q in select * from public.questions where test_id = a.test_id loop
    v_total := v_total + q.marks;
    sel := null;
    if not late and jsonb_typeof(p_answers) = 'object' and (p_answers ->> q.id::text) is not null then
      begin sel := (p_answers ->> q.id::text)::int; exception when others then sel := null; end;
    end if;
    if sel is null or sel < 0 then
      v_skip := v_skip + 1;
      insert into public.attempt_answers (attempt_id, question_id, selected_index, is_correct) values (a.id, q.id, null, null);
    elsif sel = q.correct_index then
      v_score := v_score + q.marks; v_correct := v_correct + 1;
      insert into public.attempt_answers (attempt_id, question_id, selected_index, is_correct) values (a.id, q.id, sel, true);
    else
      v_score := v_score - q.negative_marks; v_wrong := v_wrong + 1;
      insert into public.attempt_answers (attempt_id, question_id, selected_index, is_correct) values (a.id, q.id, sel, false);
    end if;
  end loop;

  update public.test_attempts set status = 'submitted', score = v_score, submitted_at = now() where id = a.id;
  return jsonb_build_object('attempt_id', a.id, 'score', v_score, 'total', v_total, 'correct', v_correct, 'wrong', v_wrong, 'skipped', v_skip);
end $$;

-- Submit hone ke BAAD hi sahi uttar + explanation
create or replace function public.get_attempt_review(p_attempt_id uuid)
returns table (question_id uuid, question_text text, options jsonb, selected_index smallint, correct_index smallint,
               is_correct boolean, marks numeric, explanation text, sort_order int)
language sql stable security definer set search_path = public as $$
  select q.id, q.question_text, q.options, aa.selected_index, q.correct_index, aa.is_correct, q.marks, q.explanation, q.sort_order
  from public.test_attempts a
  join public.questions q on q.test_id = a.test_id
  left join public.attempt_answers aa on aa.attempt_id = a.id and aa.question_id = q.id
  where a.id = p_attempt_id and a.user_id = auth.uid() and a.status = 'submitted'
  order by q.sort_order, q.created_at;
$$;

revoke all on function public.get_test_questions(uuid), public.start_attempt(uuid),
  public.submit_attempt(uuid, jsonb), public.get_attempt_review(uuid) from public, anon, authenticated;
grant execute on function public.get_test_questions(uuid), public.start_attempt(uuid),
  public.submit_attempt(uuid, jsonb), public.get_attempt_review(uuid) to authenticated;
