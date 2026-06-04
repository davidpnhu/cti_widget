var uiLogIn = "#uiLogIn";
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
var menu_user = "#menu-user";
var ui_username = "#username";
var ui_pwd = "#pwd";
var ui_ext = "#ext";
var loginId;
var userMenu = "#userMenu";
var uiHome = "#uiHome";

let groupedList = [];
let filtered = [];
let currentPage = 1;
const perPage = 5;
const list = document.getElementById("listGroup");
const pagination = document.getElementById("pagination");


const getCookie = (name) => {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1] || null;
};

function getAllCookies() {
  const cookies = {};

  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = decodeURIComponent(value);
  });

  return cookies;
}



function handleCookie() {
  var name = $("cookieName").val();
  let value = getCookie(name);
  $("cookieVal").val(value);
  // Usage
  debugger;

  const allCookies = getAllCookies();
  $("cookieVal").val(allCookies);
  $("cookieVal").val(document.cookie);
}



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






function searchContact() {
  const val = this.value.toLowerCase();

  filtered = groupedList.filter(item =>
    item.group.toLowerCase().includes(val) ||
    item.name.toLowerCase().includes(val) ||
    item.desc.toLowerCase().includes(val) ||
    item.phone.toLowerCase().includes(val)
  );

  currentPage = 1;
  renderList();
  renderPagination();
}




function handleContactList() {
  debugger;
  var xmlBody;
  var url = getURL() + "TeamResource/15/PhoneBooks";
  callFinesse(url, "GET", "", successContactList, errorMessage);
}

function successContactList(data) {
  debugger;
  var rowsContent
  $(data).find("PhoneBook").each(function () {
    let phoneBook = $(this).find("name").text();

    $(data).find("Contact").each(function () {
      let fname = $(this).find("firstName").text();
      let lname = $(this).find("lastName").text();
      let description = $(this).find("description").text();
      let phoneNumber = $(this).find("phoneNumber").text();

      // add to list
      groupedList.push({
        group: phoneBook,
        name: `${lname} ${fname}`,
        desc: description,
        phone: phoneNumber
      });

    });
  });

  debugger;
  //  Sort by group
  groupedList.sort((a, b) => a.group.localeCompare(b.group));

  filtered = [...groupedList];

  renderList();
  renderPagination();

}

function renderList() {
  list.innerHTML = "";

  const start = (currentPage - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  let currentGroup = null;

  paginated.forEach(item => {

    if (item.group !== currentGroup) {
      const header = document.createElement("li");
      header.className = "list-group-item active";
      header.textContent = item.group;
      list.appendChild(header);

      currentGroup = item.group;
    }

    const li = document.createElement("li");
    li.className = "list-group-item";

    const row = document.createElement("div");
    row.className = "row";


    const nameSpan = document.createElement("span");
    nameSpan.className = "contactName";
    nameSpan.textContent = `${item.name || ""}`;

    const descSpan = document.createElement("span");
    descSpan.className = "contactDesc";
    descSpan.textContent = `${item.desc || ""}`;

    const nameCol = document.createElement("div");
    nameCol.className = "col-6 fw-bold";
    nameCol.appendChild(nameSpan);
    nameCol.appendChild(document.createElement("br"));
    nameCol.appendChild(descSpan);

    const phoneSpan = document.createElement("span");
    phoneSpan.className = "contactPhone";
    phoneSpan.textContent = `${item.phone || ""}`;

    const phoneI = document.createElement("i");
    phoneI.className = "bi bi-telephone-forward phone-transfer";
    phoneI.appendChild(phoneSpan);

    const phoneCol = document.createElement("div");
    phoneCol.className = "col-6 text-end";
    phoneCol.appendChild(phoneI);

    row.appendChild(nameCol);
    row.appendChild(phoneCol);
    li.appendChild(row);

    list.appendChild(li);



  });
}

//  Render Pagination
function renderPagination() {
  pagination.innerHTML = "";

  const totalPages = Math.ceil(filtered.length / perPage);

  const maxVisible = 5; // how many numbers to show
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);

  // adjust start if near end
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  // ✅ Prev button
  createPageItem("Prev", currentPage - 1, currentPage === 1);

  // ✅ First page + ellipsis
  if (start > 1) {
    createPageItem(1, 1);
    if (start > 2) {
      createEllipsis();
    }
  }

  // ✅ Page numbers
  for (let i = start; i <= end; i++) {
    createPageItem(i, i, false, i === currentPage);
  }

  // ✅ Last page + ellipsis
  if (end < totalPages) {
    if (end < totalPages - 1) {
      createEllipsis();
    }
    createPageItem(totalPages, totalPages);
  }

  // ✅ Next button
  createPageItem("Next", currentPage + 1, currentPage === totalPages);
}

function createPageItem(text, page, disabled = false, active = false) {
  const li = document.createElement("li");
  li.className = "page-item " +
    (disabled ? "disabled " : "") +
    (active ? "active" : "");

  const btn = document.createElement("button");
  btn.className = "page-link";
  btn.textContent = text;

  btn.onclick = () => {
    if (!disabled) {
      currentPage = page;
      renderList();
      renderPagination();
    }
  };

  li.appendChild(btn);
  pagination.appendChild(li);
}

function createEllipsis() {
  const li = document.createElement("li");
  li.className = "page-item disabled";

  const span = document.createElement("span");
  span.className = "page-link";
  span.textContent = "...";

  li.appendChild(span);
  pagination.appendChild(li);
}


function showLogIn() {
  $(uiHome).hide();
  $(userMenu).hide();
  $(ui_username).val("");
  $(ui_pwd).val("");
  $(ui_ext).val("");
  $(uiLogIn).show();
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

function handleLogOut(id) {
  debugger;
  var xmlBody;
  var url = getURL() + "User/" + $(ui_username).val();
  xmlBody = `<User><state>LOGOUT</state><reasonCodeId>${id}</reasonCodeId></User>`;
  callFinesse(url, "PUT", xmlBody, successLogOut, errorMessage);
}

function successLogOut() {
  showLogIn();
}

function handleState() {
  // Set State
  debugger;
  var xmlBody;
  var url = getURL() + "User/" + getAgentId();
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
  var url = getURL() + "User/" + $(ui_username).val();
  extension = $('#ext').val();
  var xmlBody = "<User><state>LOGIN</state><extension>" + extension + "</extension></User>";

  callFinesse(url, "PUT", xmlBody, successLogIn, errorLogIn);


}

function successLogIn(data) {
  debugger;
  loginId = $(ui_username).val();
  successMessage();
  $(uiLogIn).hide();
  $(uiHome).show();
  $(userMenu).show();
  handleContactList();
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
  dialog = "";
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
    auth = btoa($(ui_username).val() + ":" + $(ui_pwd).val()); // Base64 encode
    cred = auth;
  }
  return auth;
}

function getAgentId() {
  return loginId;
}

function handleAnswer() {
  debugger;
  // get Dialog first
  getDialogs();

}

function successAnswer(data) {
  debugger;
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

function getDialogs() {
  // get Dialog
  debugger;
  dialog = "";
  var agentId = getAgentId();
  var url = getURL() + "User/" + agentId + "/Dialogs";

  callFinesse(url, "GET", "", successDialogs, errorMessage);

}

function successDialogs(data) {
  console.log(data);
  ANI = formatInternationalWithDashes($(data).find("Dialog > fromAddress").text()) || noDialog;
  console.log("From Address is", ANI);
  $(callerId).val(ANI);
  dialog = $(data).find("Dialog > id").text();
  debugger;
  if (dialog) {
    // Accept call
    var agentId = getAgentId();
    var url = getURL() + "Dialog/" + dialog;
    var xmlBody = "<Dialog><targetMediaAddress>" + extension + "</targetMediaAddress><requestedAction>ANSWER</requestedAction></Dialog>";
    callFinesse(url, "PUT", xmlBody, successAnswer, errorMessage);
  }
}

/* 
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
} */

function handlePostMessage(payload, type) {
  try {
    console.log("Sending Payload to Parent Window:", payload);
    window.parent.postMessage(payload, "*");

    // Receive message from parent
    window.addEventListener("message", function (event) {
      debugger;
      console.log(event);
    });

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
