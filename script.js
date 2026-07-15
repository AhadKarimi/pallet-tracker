async function search(){
const b=document.getElementById('barcode').value;
const r=await fetch('/api/search?barcode='+encodeURIComponent(b));
const d=await r.json();
document.getElementById('title').innerText=d.title||'Not found';
document.getElementById('image').src=d.image||'';
}