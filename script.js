
function formatInternationalWithDashes(phone) {
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





function handleAccept() {
    // Example
//console.log(formatInternationalWithDashes("6138091652"));
// +1 613-809-1652
  debugger;
  var auth = "Basic " + $('#auth').val();
  //"https://canbs-ccx-pub.internal.bloodservices.ca:8445/finesse/api/User/1002005/Dialogs"
  var url = $('#api').val();
  //  "https://my1002373.us1.test.crm.cloud.sap/sap/c4c/api/v1/account-service/accounts?$filter=defaultCommunication/phoneNormalisedNumber%20eq%20%27%2B16131112222%27&$select=displayId,isNaturalPerson";
  $.ajax({
    url: url,
    method: "GET",
    headers: {
      "Authorization": auth
    },
    success: function (data) {
      debugger;
      console.log(data);
      var fromAddress = formatInternationalWithDashes($(data).find("Dialog > fromAddress").text());
      console.log("From Address is", fromAddress);
      $('#callerID').val(fromAddress);
      var parameters = {
        Type: "CALL",
        EventType: "INBOUND",
        Action: $('#action').val(),
        ANI: fromAddress,


      };
      var payload = formXMLPayload(parameters);
      handlePostMessage(payload, "XML");
    },
    error: function (err) {
      debugger;
      console.error(err);
    }
  });

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
  $('#uiPayload').text(payload);
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
