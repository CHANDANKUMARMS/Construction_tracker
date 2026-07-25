const companyBtn=document.getElementById("companyBtn");

const individualBtn=document.getElementById("individualBtn");


companyBtn.addEventListener("click",()=>{

    window.location.href="company/auth.html";

});


individualBtn.addEventListener("click",()=>{

    window.location.href="individual/auth.html";

});