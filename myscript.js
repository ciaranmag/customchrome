var extArray = [];
var activeExtensions = [];
var inactiveExtensions = [];
var btnId;
var profilesHolder = {};
var profiles = [];

// Handlebars for active and inactive lists
var source   = $("#entry-template").html();
var template = Handlebars.compile(source);

// Handlebars for extList (modal popup for adding extensions to profiles)
var extListSource   = $("#extList-template").html();
var extListTemplate = Handlebars.compile(extListSource);


$(document).ready(function(){

	$('#editBtn').hide();

	// call function to check storage.sync for existing user profiles:
	getProfiles();

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

			// setting switches to either on or off
			var state = entry.enabled;
			if(state === true){
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
		});

		extStateListener(); // run the function which listens for a change in a checkbox state
		

// THE BELOW FOR LOOP WAS CREATED BASED ON THE profilesHolder STRUCTURE BELOW

		// profilesHolder = { // "profile1" etc. will be the user's custom name e.g. "Web Dev"
		// 	"profile1": profile1,
		// 	"profile2": profile2,
		// 	"profile3": profile3,
		// };

		// profile1 =[
		// 	extArray[0]
		// ];

		// the amount of extension profiles the user has
		// var sizeOfProfilesHolder = Object.keys(profilesHolder).length;

		// for (var i = 0; i < sizeOfProfilesHolder-1; i++) { // cycle through the profilesHolder
		// 	for (key in profilesHolder){ // cycle through the extension profiles
		// 		$("#" + key).addClass("on"); // default turn the profile btn to the on appearance
		// 		for (var i = 0; i < profilesHolder[key].length; i++) { // cycle through the extensions within the profile
		// 			if (profilesHolder[key][i]["enabled"] === false) { // if any of the extensions are turned off then the profile isn't fully on so give it the off appearance
		// 				$("#" + key).removeClass("on");
		// 				$("#" + key).addClass("off");
		// 			}
		// 		};
		// 	}
		// };

		$(".extId").hide(); // just here to reference each individual ext
		$(".extState").hide(); // just here to reference each individual ext's state

	});

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
$(".profile-btn").click(function(){ // if a profile btn is clicked
	console.log("see the click");
	btnId = $(this).attr("id"); // find out which one and assign to btnId
	btnIdConvert = btnId.split('_').join(' '); // lower case and replace underscore for space
	if ($(this).hasClass("on")) { // if the btn is currently on then turn all extensions off
		// window[btnIdConvert].forEach(function(extensionObj){
		// 	chrome.management.setEnabled(extensionObj.id, false, function (){
		// 		Materialize.toast(btnId+' is now off', 2000, 'ccToastOff');
		// 	});
		// })
		$(this).removeClass("on").addClass("off");
	}
	else if ($(this).hasClass("off")) { // if the btn is currently off then turn all extensions on
		// window[btnIdConvert].forEach(function(extensionObj){
		// 	chrome.management.setEnabled(extensionObj.id, true, function (){
		// 		Materialize.toast(btnId+' is now on', 2000, 'ccToastOn');
		// 	});
		// })
		$(this).removeClass("off").addClass("on");
	}
});


function extStateListener() { // turn on/off extensions when toggle is switched
	$('.js-switch').change(
		function(){
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


function checkboxlistener() { // turn on/off extensions when toggle is switched
	$('.extList-toggle input').change(
		function(){
			//get the extension id the user clicked
			var id = $(this).attr('appid');
			console.log(id);
			
		})
}


// listen for addProfile button press
// add a button to list 
// prompt for profile name
// set that name as button text
// add that profile to the storage.sync object...
$('#addProfile').click(
	function(){
		console.log('user is adding a profile');
		//open modal
		$('#profilePrompt').openModal({
			complete: function() {

				// function to run when modal is dismissed
			},

		});
	});

$('#nameSubmit').submit(
	function(e){
		e.preventDefault();
		// catch the name the user selected
		var name = $('#name').val().toLowerCase();
		// check if it's empty
		if (name === ""){
			// name is empty, don't close modal and prompt user for name
			console.log('name is empty, user must enter a (unique) name');
			Materialize.toast('Your profile needs a name!', 2000, 'alert');
			return;
		}

		// check if it's the same name as an existing profile
		// ADD .toLowerCase TO THIS TO MAKE SURE IT WORKS
		if ($.inArray(name, profiles) != -1){
			console.log('profile already exists');
			Materialize.toast('Profile already exists!', 2000, 'alert');
			return;
		}

		// check if it's the first profile to be added
		// push name to profiles array
		if (typeof profiles === 'undefined') {
			profiles = [name];
		} else {
			// profiles.push(name); // old code - new code creates array too
			profiles[name] = [];
		}
		
		// push name to profiles array in storage.sync - this is more of an overwrite isn't it?
		chrome.storage.sync.set({'profiles':profiles}, function(){
			console.log('storage.sync updated with new profile')
		})

		console.log('user is adding the '+name+' profile');
		// HTML code for profile btn changing string to lower case and replacing spaces with underscores
		var btnHtml = "<a class='profile-btn off' id='"+name.split(' ').join('_')+"'>"+name.toString()+"</a>";
		// append new button with new profile name to profile-holder
		$('.profile-holder').append(btnHtml);
		// set profile name to user-defined profile name
		$('#name').val("");
		// close modal
		$('#profilePrompt').closeModal();

		// after half a second open the modal, user can specify what extensions to add to profile
		setTimeout(function(){
			addExtensions(name);
		}, 500)
	}
)

// add extensions to new profile modal
var addExtensions = function(name){
	// open the modal
	$('#addExts').openModal({
			complete: function() {
				// turn h4 text back to normal after modal is dismissed
				$('#addExts h4').text(a);
			}
		});

	// change H5 text to say "add extensions to [profile name]"
	var a = $('#addExts h4').text();
	$('#addExts h4').text(a + " " + name);


	// loop over extArray to populate the list
	extArray.forEach(function(ext){
		// console.log(ext);
		$('#extList').append(extListTemplate(ext));
	})
}


// ADD THESE TO THE SELECTING EXTENSIONS FOR A PROFILE CLOSING MODAL STAGE
// $('#profileHeader').css("background-color", "#f3f3f3");
// $('#editBtn').show();
// $('#noProfilesText').hide();




// retrieve profiles from chrome.storage:
var getProfiles = function(){
	// check storage for any profiles
	chrome.storage.sync.get('profiles', function(obj){
		// console.log(obj)

		profiles = obj.profiles;

		// if there are no profiles, exit function
		if(!(obj.profiles)){
			$('#noProfilesText').show();
			$('#profileHeader').css("background-color", "#03A9FA");
			console.log('no profiles exist yet');
			return;
		}

		$('#noProfilesText').hide();

		console.log('length of profiles array is:'+obj.profiles.length);
		// set l to number of profiles
		var l = obj.profiles.length;
		// set variable to hold profile name
		var name;
		// loop over each profile and append it to the profiles-holder
		for (i=0; i<l; i++){
			console.log('adding '+obj.profiles[i]+" to profiles holder");
			name = obj.profiles[i];
			var btnHtml = "<a class='profile-btn off' id='"+name.toLowerCase()+"'>"+name+"</a>";
			// append to profile-holder
			$('.profile-holder').append(btnHtml);
		}
	})
}


// remove all profiles from chrome.storage:
$("#rmv").click(function(){
	// a quick one-line removes all profiles
	chrome.storage.sync.clear()
})














