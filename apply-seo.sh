#!/bin/sh
# Chalane ka tareeka (repo ke andar, Study-Universe- folder me):   sh apply-seo.sh
# Ye 8 pages ke title wali ek-ek line me description jodta hai, aur Login/Signup jaise pages ko Google se door rakhta hai (noindex).
# Dobara chalane se kuch nahi bigadta.

fix() { # $1 = file, $2 = purani line ka tukda, $3 = nayi line ka tukda
  if [ ! -f "$1" ]; then echo "SKIP  $1  (file nahi mili)"; return; fi
  if grep -qF "$2" "$1"; then
    sed -i "s#$2#$3#" "$1" && echo "OK    $1"
  else
    echo "SKIP  $1  (pehle se badli hui hai ya line alag hai)"
  fi
}

fix app/about/page.tsx          '{ title: "About" }'            '{ title: "About", description: "Study Universe ke baare me jaano: SSC CGL aur dusri exams ke liye free tasks, books, PDFs, mock tests aur video courses ek hi jagah." }'
fix app/contact/page.tsx        '{ title: "Contact" }'          '{ title: "Contact", description: "Study Universe team se sampark karo: sawal, suggestion ya feedback bhejo. Hum jaldi jawab dete hain." }'
fix app/privacy/page.tsx        '{ title: "Privacy Policy" }'   '{ title: "Privacy Policy", description: "Study Universe ki Privacy Policy: aapka data kaise surakshit rakha jata hai aur kaise use hota hai." }'
fix app/terms/page.tsx          'Conditions" }'                 'Conditions", description: "Study Universe ke Terms aur Conditions: website use karne ke niyam." }'
fix app/login/page.tsx          '{ title: "Login" }'            '{ title: "Login", robots: { index: false, follow: true } }'
fix app/signup/page.tsx         '{ title: "Signup" }'           '{ title: "Signup", robots: { index: false, follow: true } }'
fix app/forgot-password/page.tsx '{ title: "Password bhool gaye" }' '{ title: "Password bhool gaye", robots: { index: false, follow: true } }'
fix app/reset-password/page.tsx '{ title: "Naya password" }'    '{ title: "Naya password", robots: { index: false, follow: true } }'

echo; echo "Ho gaya. Ab 'git diff --stat' chalao aur dekho."
