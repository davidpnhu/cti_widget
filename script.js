function handleAccept() {
debugger;
var auth = "Basic " + $('#auth').val();
$.ajax({
  url: "https://canbs-ccx-pub.internal.bloodservices.ca:8445/finesse/api/Dialog/47544586",
  method: "GET",
  headers: {
    "Authorization": auth 
  },
  success: function (data) {
    debugger;
    console.log(data);
  },
  error: function (err) {
    debugger;
    console.error(err);
  }
});
    
}
