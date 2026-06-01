var uiLogIn = "#uiLogIn";
var tabsCTI = "#tabsCTI";
var uiState = "#uiState";
var uiControls = "#uiControls";
var btnEnd = "#End";
var btnAccept = "#Accept";
var callerId = "#callerID";
var uiPayload = "#uiPayload";
var cred = "";
var extension = "";
var noDialog = "no dialog currently.";
var dialog;
var ANI;

function showAutoCloseDialog(message, timeout = 1000) {
  $("<div>" + message + "</div>").dialog({
    modal: true,
    title: "Message",
    open: function () {
      var dlg = $(this);
      setTimeout(function () {
        dlg.dialog("close");
      }, timeout);
    },
    close: function () {
      $(this).remove(); // clean up DOM
    }
  });
}


function formatInternationalWithDashes(phone) {
  //console.log(formatInternationalWithDashes("6138091652"));
  // +1 613-809-1652
  const digits = phone.replace(/\D/g, "");

  // Assume North America if 10 digits
  if (digits.length === 10) {
    return `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // If already includes country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone; // fallback if unknown format
}


function showControls() {
  $(uiControls).show();
  $(btnAccept).show();
  $(btnEnd).hide();
  $(callerId).val("");
 // $(uiPayload).text("");
}

function showEnd() {
  if ($(callerId).val() !== noDialog) {
    $(btnEnd).show();
    $(btnAccept).hide();
  }
}

function handlePoll() {
  var count = 0;
  do {
    var checked = $('#enablePoll').is(':checked');
    console.log("enablePoll:" + checked);
    //handleAccept();
    //debugger;
    count++;
    $('#countPoll').text(count);
    setTimeout(() => {
      console.log("sleeping");
    }, 5000);
  } while (checked == true);
}

function callFinesse(url, method, xmlBody, successHandler, errorHandler) {

  var auth = getAuth();
  $('#api').text(url);
  $.ajax({
    url: url,
    method: method,
    contentType: "application/xml",
    data: xmlBody,
    headers: {
      "Authorization": "Basic " + auth
    },
    success: successHandler,
    error: errorHandler
  });
}


function handleState() {
  // Set State
  debugger;
  var xmlBody;
  var url = getURL() + "User/" + $('#username').val();
  var selState = $(uiState).val();
  if (selState === "READY") {
    xmlBody = "<User><state>READY</state></User>";
  }
  else {
    xmlBody = "<User><state>NOT_READY</state><reasonCodeId>" + selState + "</reasonCodeId></User>";
  }
  callFinesse(url, "PUT", xmlBody, successState, errorMessage);

}

function successState() {
  showAutoCloseDialog("Success!", 500);
  var selState = $(uiState).val();
  if (selState === "READY") {
    showControls();
  }
  else {
    $(uiControls).hide();
  }
}

function successMessage() {
  showAutoCloseDialog("Success!", 500);
}

function errorMessage() {
  showAutoCloseDialog("Failed!", 500);
}

function handleLogIn() {
  // LogIn
  debugger;

  var url = getURL() + "User/" + $('#username').val();
  extension = $('#ext').val();
  var xmlBody = "<User><state>LOGIN</state><extension>" + extension + "</extension></User>";

  callFinesse(url, "PUT", xmlBody, successLogIn, errorLogIn);


}

function successLogIn(data) {
  debugger;
  successMessage();
  $(uiLogIn).hide();
  $(tabsCTI).show();
}

function errorLogIn(err) {
  debugger;
  errorMessage();
}

function handleEnd() {
  // End call
  debugger;
  var url = getURL() + "Dialog/" + dialog;
  var xmlBody = "<Dialog><targetMediaAddress>" + extension + "</targetMediaAddress><requestedAction>DROP</requestedAction></Dialog>";

  callFinesse(url, "PUT", xmlBody, successEnd, errorMessage);
}

function successEnd() {
  debugger;
    var parameters = {
    Type: "CALL",
    EventType: "INBOUND",
    Action: "END",
    ANI: ANI,


  };
  var payload = formXMLPayload(parameters);
  handlePostMessage(payload, "XML");
  successMessage();
  showControls();
}

function getURL() {
  var url = $('#api').val() || "https://canbs-ccx-pub.internal.bloodservices.ca:8445/finesse/api/";
  return url;
}

function getAuth() {
  if (cred)
    return cred;
  //otherwise
  var auth;
  if ($('#pwd')) {
    auth = btoa($('#username').val() + ":" + $('#pwd').val()); // Base64 encode
    cred = auth;
  }
  return auth;
}

function getAgentId() {
  id = "1002005";
  return id;
}


function handleAccept() {
  // Accept call
  debugger;
  var agentId = getAgentId();
  var url = getURL() + "User/" + agentId + "/Dialogs";

  callFinesse(url, "GET", "", successAccept, errorAccept);
}

function errorAccept(err) {
  debugger;
  console.error(err);
}

function successAccept(data) {
  debugger;
  console.log(data);
  ANI = formatInternationalWithDashes($(data).find("Dialog > fromAddress").text()) || noDialog;
  console.log("From Address is", ANI);
  $(callerId).val(ANI);
  dialog = $(data).find("Dialog > id").text();
  var parameters = {
    Type: "CALL",
    EventType: "INBOUND",
    Action: $('#action').val(),
    ANI: ANI,


  };
  var payload = formXMLPayload(parameters);
  handlePostMessage(payload, "XML");
  showEnd();
}

function handlePostMessage(payload, type) {
  try {
    console.log("Sending Payload to Parent Window:", payload);
    window.parent.postMessage(payload, "*");
    displayPayloadMessage(payload);
  } catch (error) {
    console.error("Error Posting Message to Parent Window:", error);

  }
}

function displayPayloadMessage(payload) {
  $(uiPayload).text(payload);
}

function formXMLPayload(parameters) {
  var sPayload = "<?xml version=\"1.0\" encoding=\"utf-8\"?><payload>";
  Object.entries(parameters).forEach(([key, value]) => {
    // If Action is "ACCEPT", leave the Action field empty
    //if (key === "Action" && value === "ACCEPT") {
    if (key === "Action" && value === "TALKING") {
      value = ""; // Set to empty string
    }
    if (value && value.trim() !== "") {
      var tag = `<${key}>${value}</${key}>`;
      sPayload += tag;
    }
  });
  sPayload += "</payload>";
  console.log("Constructed Payload:", sPayload);
  return sPayload;
}
