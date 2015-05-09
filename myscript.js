var extArray = [];
var activeExtensions = [];
var inactiveExtensions = [];
var btnId;
idList = [];

// Handlebars for active and inactive lists
var source   = $("#entry-template").html();
var template = Handlebars.compile(source);

// Handlebars for extList (modal for adding extensions to profiles)
var extListSource   = $("#extList-template").html();
var extListTemplate = Handlebars.compile(extListSource);


$(document).ready(function(){

	getProfiles(); // call function to check storage.sync for existing user profiles

	$('.modal-trigger').leanModal();

	chrome.management.getAll(function(info) {
		// info is a list of all user installed apps, extensions etc push extensions to extArray
		info.forEach(function(entry) {
			if(entry.type === "extension"){
				extArray.push(entry);
			}
		})

		// Sort extArray in alphabetical order based on the extension's name
		extArray.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});

		extArray.forEach(function(entry) {
			// extension icons are stored in entry.icons, but not all extensions have icons
			if (entry.icons === undefined) {
				imgsrc = 'icon-128.png'  // if there aren't any icons, set a default
			} else {
				// if there is an array of icons, we want the highest res one (which is the last one in the array) so get the array length (-1) to get the last icon then set that item's url as our app icon url
				imgsrc = entry.icons[entry.icons.length-1].url;
			}
			entry.pic = imgsrc; // setting the url we got earlier as entry.pic

			var state = entry.enabled;
			if(state === true){ // set switches to either on or off
				state = "checked"
			} else {
				state = ""
			}
			entry.stringEnabled = state;

			// divide the extensions into two separate lists of active (enabled = true) and inactive (enabled = off) and output them into the appropriate HTML div
			if (entry.enabled) {
				$('#activeExtensions').append(template(entry));
			} else {
				$('#inactiveExtensions').append(template(entry));
			}
		}); // close extArray.forEach

		extStateListener(); // run the function which listens for a change in a checkbox state

		chrome.storage.sync.get(function(obj){
			// setting the profile buttons to on/off appearance
			var sizeOfStoredObject = Object.keys(obj).length;
			for (var n = 0; n < sizeOfStoredObject; n++) { // cycle through the profilesHolder
				// console.log(Object.keys(obj)[i])
				for (key in obj) { // cycle through the extension profiles
					$("#" + key).addClass("on").removeClass("off");
					for (var n = 0; n < obj[key].length; n++) { // cycle through the extensions within the profile
						for (i=0;i<extArray.length;i++) {
							// console.log("this is the extension array with obj[key]["+n+"] ---" +obj[key][n]);
							if (extArray[i]["id"] === obj[key][n]) {
								if (extArray[i]["enabled"] === false) {
									$("#" + key).removeClass("on").addClass("off");
								}
							}
						}
					}
				}
			}
		}) // close chrome.storage.sync.get

		$(".extId").hide(); // just here to reference each individual ext
		$(".extState").hide(); // just here to reference each individual ext's state

	}); // close chrome.management.getAll

	// Search
	$("#searchbox").keyup(function(){
			// Retrieve the input field text
			var filter = $(this).val();
			// Loop through the extensions
			$(".extName").each(function(){
				var h = $(this).parents('.extBlock'); //setting h as the extension's holding div
				if ($(this).text().search(new RegExp(filter, "i")) < 0) { // searching extName for the #searchbox's contents if it doesn't match then fadeOut the holding div
					h.fadeOut(); //fade the parent div out if no match found
				} else {
					h.fadeIn(); // show the list item if the phrase matches
				}
			});
	});
	$('.searchbox').focus();

}); // close $(document).ready

// after clicking a profile button toggle it's appearance (on or off) and cycle through associated extensions turning them all on or off
$("body").on("click",".profile-btn",function(){ // if a profile btn is clicked
	btnId = $(this).attr("id"); // find out which one and assign to btnId
	btnIdConvert = btnId.split('_').join(' '); // lower case and replace underscore for space

	if ($(this).hasClass("on")) { // if the btn is currently on then turn all extensions off
		chrome.storage.sync.get(function(obj){
			Object.keys(obj).forEach(function(key){
				if (key === btnIdConvert) {
					for (var i = 0; i < obj[btnIdConvert].length; i++) {
						chrome.management.setEnabled(obj[btnIdConvert][i], false, function (){})
					}
				}
				Materialize.toast(btnIdConvert+' is now off', 2000, 'ccToastOff')
			})
		})
	$(this).removeClass("on").addClass("off"); // change profile btn to "off" appearance
	location.reload(false); // adding false lets the page reload from the cache
	}

	else if ($(this).hasClass("off")) { // if the btn is currently off then turn all extensions on
		chrome.storage.sync.get(function(obj){
			Object.keys(obj).forEach(function(key){
				if (key === btnIdConvert) {
					for (var i = 0; i < obj[btnIdConvert].length; i++) {
						chrome.management.setEnabled(obj[btnIdConvert][i], true, function (){})
					}
				}
				Materialize.toast(btnIdConvert+' is now on', 2000, 'ccToastOn')
			})
		})
	$(this).removeClass("off").addClass("on"); // change profile btn to "on" appearance
	location.reload(false); // adding false lets the page reload from the cache
	}

})

function extStateListener() { // turn on/off extensions when toggle is switched
	$('.js-switch').change(function(){
		var id = $(this).parents('.switch').attr('id'); // get the app id
		var name = $(this).parents('.switch').attr('name'); // get the app name
		if($(this).is(':checked')){
			chrome.management.setEnabled(id, true, function (){
				Materialize.toast(name+' is now on', 2000, 'ccToastOn');
			});
		} else {
			chrome.management.setEnabled(id, false, function (){
				Materialize.toast(name+' is now off', 2000, 'ccToastOff');
			});
		}
	})
}

// listen for addProfile button press, add a button to HTML, prompt for profile name, set that name as button text, add that profile to the storage.sync object
$('#addProfile').click(
	function(){
		$('#profilePrompt').openModal({
			complete: function() { // function to run when modal is dismissed
			},
		});
	});

$('#nameSubmit').submit(
	function(e){
		e.preventDefault();
		name = $('#name').val().toLowerCase(); // catch the profile name the user entered
		// // check if it's a valid name
		// if (name ????){ // regex error
		// // name doesn't match regex rules, don't close modal and prompt user for name
		// 	Materialize.toast('Profile names must be between 1 and 15 characters and only include letters, numbers, and spaces', 3000, 'alert');
		// 	return;
		// }

		// // check if it's the same name as an existing profile
		// if ($.inArray(name, profiles) != -1){ // schema has changed so this needs to change - check keys instead of profiles array
		// 	console.log('profile already exists');
		// 	Materialize.toast('Profile already exists!', 2000, 'alert');
		// 	return;
		// }

		console.log('user is adding the '+name+' profile');
		// HTML code for profile btn changing string to lower case and replacing spaces with underscores
		var btnHtml = "<a class='profile-btn off' id='"+name.split(' ').join('_')+"'>"+name+"</a>";
		$('.profile-holder').append(btnHtml); // append new button with new profile name to profile-holder
		$('#name').val(""); // set profile name to user-defined profile name
		$('#profilePrompt').closeModal();
		setTimeout(function(){
			addExtensions(name);
		}, 500) // after half a second open the modal, user can specify what extensions to add to profile
	}
)

function addExtensions(name) { // add extensions to new profile modal
	$('#addExts').openModal({
		ready: function() {
			checkboxlistener(name)
		},
		complete: function() {
			$('#addExts h4').text(a); // turn h4 text back to normal after modal is dismissed
			$('#extList').html('');
			submitThatShit();
		}
	});

	var a = $('#addExts h4').text();
	$('#addExts h4').text(a + " " + name); // change H4 text to say "add extensions to [profile name]"
	extArray.forEach(function(ext){ // loop over extArray to populate the list
		$('#extList').append(extListTemplate(ext));
	})
}

function checkboxlistener() { // turn on/off extensions when toggle is switched
	$('.extList-toggle input').change(function(){
		var id = $(this).attr('appid'); //get the extension id the user clicked
		idList.push(id)
	})
}

function submitThatShit() {
	tempObj = {};
	tempObj[name] = idList;
	chrome.storage.sync.set(tempObj, function () {
	  console.log('Saved', name, idList);
	})
}

function getProfiles() { // check storage for any profiles
	chrome.storage.sync.get(function(obj){
		if ( Object.keys(obj).length === 0 ) { // if there are no profiles, exit function
			$('#noProfilesText').show();
			$('#profileHeader').css("background-color", "#03A9FA");
			$('#editBtn, .profileBtn1, .profileBtn2, .profileBtn3, .profileBtn4, .profileBtn5').hide();
			console.log('no profiles exist yet');
			return;
		}

		$('#noProfilesText').hide();
		$('#profileHeader').css("background-color", "#f3f3f3");
		$('#editBtn').show();

		var allKeys = Object.keys(obj);
		for (var i = 0; i < allKeys.length; i++) {
			var name = allKeys[i];
			var btnHtml = "<a class='profile-btn off' id='"+name.toLowerCase()+"'>"+name+"</a>";
			$('.profile-holder').append(btnHtml); // append to profile-holder
		};
	})
}

// temp button to remove all profiles from chrome.storage:
$("#rmv").click(function(){
	// a quick one-line removes all profiles
	chrome.storage.sync.clear();
})

