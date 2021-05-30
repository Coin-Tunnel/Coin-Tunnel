document.getElementById("serverTime").innerHTML = "cannot reach server at this time"
var version = detectIE();
if (version !== false){
  var source = new EventSource('/sse/server-time');

  // handle messages
  source.onmessage = function(event) {
      console.log(event.data);
      document.getElementById("serverTime").innerHTML = event.data
  };
  source.onclose = function (event) {
    console.log(event)
  }
}else document.getElementById("serverTime").innerHTML = "cannot reach server at this time"

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
      function detectIE() {
        var ua = window.navigator.userAgent;
      
        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
          return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }
      
        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
          var rv = ua.indexOf('rv:');
          return 11;//parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }
      
        var edge = ua.indexOf('Edge/');
        if (edge > 0) {
          return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
        }
        return false;
      }