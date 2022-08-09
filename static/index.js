const search = () => {
    let filter = document.getElementById('mysearchinput').value.toUpperCase();
    let ul = document.getElementById('items');
    let li = ul.getElementsByTagName('li');
    for(var i = 0; i < li.length; i++){
        let a = li[i].getElementsByTagName('a')[0];
        let text = a.textContent.toUpperCase();
        if(filter != '' && text.indexOf(filter) > -1){
            li[i].style.display = '';
        }
        else{
            li[i].style.display = 'none';
        }
    }
}

// document.addEventListener('DOMContentLoaded', () => {
//     const codeBlock = document.getElementById('code');
//     const copyButton = document.getElementById('copy-button');
//     const copySuccess = document.getElementById('copy-success');
  
//     const copyTextHandler = () => {
//       const text = codeBlock.innerText;
//       navigator.clipboard.writeText(text).then(
//         () => {
//           copySuccess.classList.add('show-mes*/sage');
//           setTimeout(() => {
//             copySuccess.classList.remove('show-message');
//           }, 2500);
//         },
//         () => {
//           console.log('Error writing to the clipboard');
//         }
//       );
//     };
//     copyButton.addEventListener('click', copyTextHandler);
//   });