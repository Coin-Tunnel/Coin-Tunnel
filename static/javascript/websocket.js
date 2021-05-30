document.getElementById("serverTime").innerHTML = "cannot reach server at this time"

var source = new EventSource('/sse/server-time');

// handle messages
source.onmessage = function(event) {
    console.log(event.data);
    document.getElementById("serverTime").innerHTML = event.data
};
        let theme = localStorage.getItem('theme');
        if (theme === "dark"){
          let slider = document.getElementById("bigTheme");
          console.log(slider)
          slider.checked = true;
          let slider1 = document.getElementById("smallTheme");
          console.log(slider1)
          slider1.checked = true
        }
async function changeTheme(){
  let localStorage = window.localStorage;
  let theme = localStorage.getItem('theme');
  await sleep(1000);
  if (theme === "dark"){
    localStorage.setItem('theme', 'light');
  }else{
    localStorage.setItem('theme', 'dark');
  }
  window.location.reload();

}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


  function signout() {
    console.log('User signed out.');
   window.location.href = "/destroySession"
      }
