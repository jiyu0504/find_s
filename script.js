const departments=[
 {name:'소프트웨어융합과',slug:'software',image:'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=700&q=85'},
 {name:'시각디자인과',slug:'visual',image:'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=700&q=85'},
 {name:'식품영양과',slug:'food',image:'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=700&q=85'},
 {name:'유아교육과',slug:'early',image:'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=700&q=85'}
];
function cards(target,employment){const el=document.getElementById(target);if(!el)return;el.innerHTML=departments.map(d=>`<a class="department-card" href="${employment?'employment-detail.html':'department-detail.html'}?dept=${d.slug}"><img src="${d.image}" alt="${d.name}"><span>${d.name}</span></a>`).join('');}
cards('department-track',false);cards('employment-track',true);
const params=new URLSearchParams(location.search);const chosen=departments.find(d=>d.slug===params.get('dept'));if(chosen){const title=document.getElementById('dept-title');if(title)title.textContent=chosen.name;}
