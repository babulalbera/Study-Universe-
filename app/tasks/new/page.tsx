import { redirect } from "next/navigation";

// Pehle naya page yahan tha; ab /tasks hi naya page hai. Purane bookmark/link yahan se wahin pahunch jayenge.
export default function TasksNewRedirect() {
  redirect("/tasks");
}
