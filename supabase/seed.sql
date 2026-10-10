-- Shuruaati data. Migrations ke baad ek baar chalao.
insert into public.site_settings (key, value) values
  ('site', '{"name":"Study Universe","tagline":"Learn • Grow • Achieve","contact_email":""}')
on conflict (key) do nothing;

insert into public.book_categories (name, sort_order) values ('Maths',1),('English',2),('Reasoning',3),('GS',4),('Video Editing',5) on conflict do nothing;
insert into public.test_categories (name, sort_order) values ('SSC CGL',1) on conflict do nothing;

insert into public.feature_cards (key,title,description,href,color,bg1,bg2,icon_url,sort_order) values
 ('free','Free Course','Top quality free courses for you',null,'#3B82F6','#1E293B','#0F172A','/images/tools/free.webp',1),
 ('books','Books','Best books & resources curated','/books','#F59E0B','#422006','#1C1917','/images/tools/books.webp',2),
 ('mock','Mock Test','Practice with real exam pattern','/mock-tests','#A855F7','#2E1065','#1E1B4B','/images/tools/mock.webp',3),
 ('task','Task','Daily tasks & streak tracker','/tasks','#10B981','#022C22','#020617','/images/tools/task.webp',4),
 ('apps','Premium Apps','Exclusive premium app access',null,'#8B5CF6','#2E1065','#1E1B4B','/images/tools/apps.webp',5),
 ('exam','Exam Prep','Complete preparation guide',null,'#EF4444','#450A0A','#1C1917','/images/tools/exam.webp',6),
 ('notes','Notes & PDFs','Handwritten notes & PDFs','/books','#06B6D4','#042F2E','#020617','/images/tools/notes.webp',7),
 ('tips','Study Tips','Smart tips to study better',null,'#EAB308','#422006','#1C1917','/images/tools/tips.webp',8)
on conflict (key) do nothing;

insert into public.social_links (key,name,action_label,subtitle,href,color,glow,border,bg1,bg2,icon_url,sort_order) values
 ('wa','WhatsApp','Join Now','Daily updates • Doubts',null,'#34E39A','#22C55E','linear-gradient(135deg,#2BF080,#15A34A)','#0E6B45','#032A1F','/images/social/wa.webp',1),
 ('tg','Telegram','Join Now','PDFs • Notes • Tests',null,'#3DB8FF','#1E90FF','linear-gradient(135deg,#3AB0FF,#1D6FEB)','#0B3F8F','#06173A','/images/social/tg.webp',2),
 ('ig','Instagram','Follow','Reels • Motivation • Tips',null,'#FF4FB0','#C026D3','linear-gradient(90deg,#FF7A1A,#E1306C,#A855F7)','#4A1A6B','#1B0B2E','/images/social/ig.webp',3),
 ('yt','YouTube','Subscribe','Free lectures • Live',null,'#FF3B30','#EF4444','linear-gradient(135deg,#FF4545,#C81E1E)','#6B1212','#240505','/images/social/yt.webp',4)
on conflict (key) do nothing;
