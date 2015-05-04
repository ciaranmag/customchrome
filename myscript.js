////////////////// POPUP.HTML

var extArray = [];
var activeExtensions = [];
var inactiveExtensions = [];
var profilesHolder = {};
var btnId;
var profile1 = [];
var profile2 = [];
var profile3 = [];
var profile4 = [];
var profile5 = [];

var profiles = [];

// Handlebars.js
var source   = $("#entry-template").html();
var template = Handlebars.compile(source);



$(document).ready(function(){
	//call function to check storage.sync for existing user profiles:
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
				// and if there is an array of icons, we want the highest res one (which is going to be the last one in the array) so find the array length, then use that value (-1) to get the last icon then set that item's url as our app icon url
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
		
		// These profiles can't reference extArray permanently because if a user installs/uninstalls extensions these extensions will change places in the extArray array
		// profile1 =[
		// 	extArray[0]
		// ];

		// profile2 =[
		// 	extArray[0],
		// 	extArray[1]
		// ];

		// profile3 =[
		// 	extArray[8],
		// 	extArray[9],
		// 	extArray[10],
		// 	extArray[11]
		// ];

		// profile4 =[
		// 	extArray[12],
		// 	extArray[13],
		// 	extArray[14],
		// 	extArray[15]
		// ];

		// profile5 =[
		// 	extArray[0],
		// 	extArray[1],
		// 	extArray[2],
		// 	extArray[3]
		// ];

		// profilesHolder = { // "profile1" etc. will be the user's custom name e.g. "Web Dev"
		// 	"profile1": profile1,
		// 	"profile2": profile2,
		// 	"profile3": profile3,
		// 	"profile4": profile4,
		// 	"profile5": profile5
		// };

		// the amount of extension profiles the user has
		var sizeOfProfilesHolder = Object.keys(profilesHolder).length;

		for (var i = 0; i < sizeOfProfilesHolder-1; i++) { // cycle through the profilesHolder
			for (key in profilesHolder){ // cycle through the extension profiles
				$("#" + key).addClass("on"); // default turn the profile btn to the on appearance
				for (var i = 0; i < profilesHolder[key].length; i++) { // cycle through the extensions within the profile
					if (profilesHolder[key][i]["enabled"] === false) { // if any of the extensions are turned off then the profile isn't fully on so give it the off appearance
						$("#" + key).removeClass("on");
						$("#" + key).addClass("off");
					}
				};
			}
		};

		// Turning individual extensions on or off with a click
		$(".extId").hide(); // hide this - just here to reference each individual ext
		$(".extState").hide(); // hide this - just here to reference each individual ext's state

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


//  TURNING PROFILE BUTTONS ON OR OFF AFTER CLICKING THEM
$(".profile-btn").click(function(){ // if a profile btn is clicked
	btnId = $(this).attr("id"); // find out which one and assign to btnId
	if ($(this).hasClass("on")) { // if the btn is currently on then turn all extensions off
		window[btnId].forEach(function(extensionObj){
			chrome.management.setEnabled(extensionObj.id, false, function (){
				Materialize.toast(btnId+' is now off', 2000, 'ccToastOff');
			});
		})
		$(this).removeClass("on");
		$(this).addClass("off");
	}
	else if ($(this).hasClass("off")) { // if the btn is currently off then turn all extensions on
		window[btnId].forEach(function(extensionObj){
			chrome.management.setEnabled(extensionObj.id, true, function (){
				Materialize.toast(btnId+' is now on', 2000, 'ccToastOn');
			});
		})
		$(this).removeClass("off");
		$(this).addClass("on");
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

//listen for addProfile button press
	// add a button to list 
	//prompt for profile name
	//set that name as button text
	//add that profile to the storage.sync object...
$('#addProfile').click(
	function(){
		console.log('user is adding a profile');
		//open modal
		$('#profilePrompt').openModal({
			complete: function() {

				//function ro run when modal is dismissed
			},

		});
	});

$('#nameSubmit').submit(
	function(e){
		e.preventDefault();
		//catch the name the user selected
		var name = $('#name').val();
		//check if it's empty
		if (name === ""){
			//name is empty, don't close modal and prompt user for name
			console.log('name is empty, user must enter a (unique) name');
			Materialize.toast('Your profile needs a name!', 2000, 'alert');
			return;
		}

		//check if it's the same name as an existing profile
		if ($.inArray(name, profiles) != -1){
			console.log('profile already exists');
			Materialize.toast('Profile already exists!', 2000, 'alert');
			return;
		}

		console.log('user is adding the '+name+' profile');
		var btnHtml = "<a class='profile-btn off' id='"+name+"'>"+name.toString()+"</a>";
		//prepend new button with new profile name to profile-holder
		$('.profile-holder').prepend(btnHtml);
		//set name to ""
		$('#name').val("");
		//close modal:
		$('#profilePrompt').closeModal();
	}
)

// /////////////////         RANDOM SHIT



// // Code to get current tab URL
// chrome.tabs.getSelected(null,function(tab) {
//     var tablink = tab.url;
// });
// // OR
// var tablink;
// chrome.tabs.getSelected(null,function(tab) {
//     tablink = tab.url;
// });
// // OR
// chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
//     var url = tabs[0].url;
// });




//////////////////         OPTIONS.HTML


//code to retrieve profiles from chrome.storage:
// learned form here: http://stackoverflow.com/questions/14531102/saving-and-retrieving-from-chrome-storage-sync

var getProfiles = function(){
	//check storage for any profiles
	chrome.storage.sync.get('profiles', function(obj){
		//console.log(obj)

		profiles = obj.profiles;

		console.log('length of profiles array is:'+obj.profiles.length);
		//set l to number of profiles
		var l = obj.profiles.length;
		//set variable to hold profile name
		var name;

		//loop over each profile and append it to the profiles-holder
		for (i=0; i<l; i++){
			console.log('adding '+obj.profiles[i]+" to profiles holder");
			name = obj.profiles[i];
			var btnHtml = "<a class='profile-btn off' id='"+name+"'>"+name+"</a>";
			//prepend to profile-holder
			$('.profile-holder').prepend(btnHtml);

		}
	})
}


















