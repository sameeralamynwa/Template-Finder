let java = document.getElementById('java');

java.addEventListener('click', function (){
  let content = document.getElementById('code');
  console.log(sourcecode);
//   content.innerText = sourcecode.java;
  content.style.display = 'none';
  alert('We are working');
})

let python = document.getElementById('python');

python.addEventListener('click', function (){
  let content = document.getElementById('code');
  console.log(content)
  content.style.display = 'none';
  alert('We are working');
})

let cpp = document.getElementById('cpp');

cpp.addEventListener('click', function (){
  let content = document.getElementById('code');
  console.log(content)
  content.style.display = 'block';
})