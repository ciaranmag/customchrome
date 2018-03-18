// Declare variables
let extArray = [],
appArray = [],
activeExtensions = [],
inactiveExtensions = [],
btnId,
idList = [],
user = {};

// Handlebars for active and inactive lists
source   = $("#entry-template").html(),
template = Handlebars.compile(source),

// Handlebars for extList (modal for adding extensions to profiles)
extListSource   = $("#extList-template").html(),
extListTemplate = Handlebars.compile(extListSource),

// Handlebars for profileList (modal for editing profiles)
profileListSource   = $("#profileList-template").html(),
profileListTemplate = Handlebars.compile(profileListSource);
// Finish declaring variables


$(function() {
	
	// listen for compact styles toggle change
	compactStylesListener();

	// listen for include apps toggle
	includeAppsListener();

	// call function to check storage.sync for existing user profiles
	getUserData(); 

	$('.modal-trigger').leanModal();
	$('#addProfileBox').hide();

	chrome.management.getAll(function(info) {
		// info is a list of all user installed apps i.e. extensions, apps, and themes
		
		// MANAGEMENT OF USER'S EXTENSIONS
		
		// push extensions to extArray
		for (let i = 0; i < info.length; i++) {
			let entry = info[i];
			switch(entry.type) {
				case "extension":
					extArray.push(entry);
					// console.log("EXTENSION", entry);
					break;
				case "packaged_app":
				case "legacy_packaged_app":
				case "hosted_app":
					// entry.name += " (APP)";
					extArray.push(entry);
					entry.isApp = '<span class="new badge"></span>';
					// console.log("PACKAGE", entry);
					break;
				default:
					console.log("This is different", entry);
			}
		}

		// sort extArray into alphabetical order based on the extensions' names
		extArray.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});

		for (let i = 0; i < extArray.length; i++) {
			let entry = extArray[i];
			// extension icons are stored in entry.icons, but not all extensions have icons
			if (entry.icons === undefined) {
				imgsrc = 'images/icon-128.png';  // if there aren't any icons, use our default icon
			} else {
				// if there is an array of icons, we want the highest res one (which is the last one in the array) so get the array length (-1) to get the last icon then set that item's url as our app icon url
				imgsrc = entry.icons[entry.icons.length-1].url;
			}
			entry.pic = imgsrc; // setting the url we just got as entry.pic

			let state = entry.enabled;
			if(state === true){ // set switches to either on or off
				state = "checked";
			} else {
				state = "";
			}
			entry.stringEnabled = state;

			// divide the extensions into two separate lists of active (enabled = true) and inactive (enabled = off) and output them into the appropriate HTML div
			if (entry.enabled) {
				$('#activeExtensions').append(template(entry));
			} else {
				$('#inactiveExtensions').append(template(entry));
			}
		} // close extArray loop
		
		// run the function which listens for a change in a checkbox state
		extStateListener(); 

		// hide apps if user has toggled that option
		if(!user.includeApps){
			// hide apps
			$('.app').hide();
		} else {
			// set toggle switch to checked
			$('.include-apps-switch').attr('checked', true);
		}

		// setting the profile buttons to on/off appearance
		for (let profile in user.profiles) {
			// for each profile, get all extension id's in that profile
			// if they are all on, add class "on" to element
			// otherwise, leave it grey
			let extensionIds = user.profiles[profile];

			let tempArray = [];

			for (let i = 0; i < extensionIds.length; i++) {
				let id = extensionIds[i];
				for (let x = 0; x < extArray.length; x++) {
					let obj = extArray[x];
					if(obj.id === id){
						tempArray.push(obj);
					}
				}
			}

			// tempArray now contains extension objects for this profile

			// finds if any of the extensions have enabled === false
			// if even one extension is off, then the profile is inactive
			let off = tempArray.some(function(ext){
				return ext.enabled === false;
			}) || false;

			// if it's on, add/remove appropriate classes
			if(!off){
				profile = profile.replace(' ', "_");
				$("#" + profile).removeClass("off").addClass("on");
			}
		}

	}); // close chrome.management.getAll

	// Search
	$("#searchbox").keyup(function(){
		// Retrieve the input field text
		let filter = $(this).val();
		// Loop through the extensions

		// toFilter array will hold all elements to search through
		// fill this depending on whether apps are on or off
		let toFilter = user.includeApps ? $(".extBlock") : $(".extBlock:not(.app)");

		toFilter.each(function(i, el){
			if($(el).find('.extName').text().search(new RegExp(filter, "i")) < 0){
				$(el).fadeOut()
			} else {
				$(el).fadeIn()
			}
		})

		// if the search returns no results then show the no results card
		setTimeout(function(){
			if ( $(".extName:visible").length === 0 ){
				$("#noResults").fadeIn();
				$('#activeExtensions').parent().css('visibility','hidden');
				$('#inactiveExtensions').parent().css('visibility','hidden');
				$('.allExtensionsContainer').css('visibility','hidden');
			} else {
				$("#noResults").hide();
				$('.allExtensionsContainer').css('visibility','visible');
				$('#activeExtensions').parent().css('visibility','visible');
				$('#inactiveExtensions').parent().css('visibility','visible');
			}
		}, 500);

	});

	$('#searchbox').focus();

}); // close $(document).ready


// after clicking a profile's on/off button, we toggle its appearance (on or off) and cycle through associated extensions turning them all on or off
$("body").on("click",".profile-btn",function(){ // if a profile btn is clicked
	
	// find out which extension was clicked and assign to btnId
	btnId = $(this).attr("id"); 
	btnIdConvert = $(this).text();

	if ($(this).hasClass("on")) { 
		// if the btn is currently on then turn all extensions off
		user.profiles[btnIdConvert].forEach(function(extensionId){
			console.log('disabling extension:', extensionId);
			chrome.management.setEnabled(extensionId, false);
		});

		Materialize.toast(btnIdConvert + ' is now off', 2000, 'ccToastOff');

		// change profile btn to "off" appearance
		$(this).removeClass("on").addClass("off"); 
		setTimeout(function(){
			// adding false lets the page reload from the cache
			location.reload(false); 
		}, 1000);

	} else if ($(this).hasClass("off")) { 
		// if the btn is currently off then turn all extensions on
		user.profiles[btnIdConvert].forEach(function(extensionId){
			console.log('enabling extension:', extensionId);
			chrome.management.setEnabled(extensionId, true);
		});

		Materialize.toast(btnIdConvert + ' is now on', 2000, 'ccToastOn');

		// change profile btn to "on" appearance
		$(this).removeClass("off").addClass("on"); 
		setTimeout(function(){
			// adding false lets the page reload from the cache
			location.reload(false); 
		}, 1000);
		
	}

});

// turn on/off extensions when toggle is switched
function extStateListener() { 
	$('.state-switch').change(function(){
		// get the app id
		let id = $(this).parents('.switch').attr('id'),
		// get the app name
		name = $(this).parents('.switch').attr('name');
		if($(this).is(':checked')){
			chrome.management.setEnabled(id, true, function (){
				Materialize.toast(name+' is now on', 2000, 'ccToastOn');
			});
		} else {
			chrome.management.setEnabled(id, false, function (){
				Materialize.toast(name+' is now off', 2000, 'ccToastOff');
			});
		}
	});
}

// listen for addProfile button press, add a button to HTML, prompt for profile name, set that name as button text, add that profile to the storage.sync object
$('.addProfile').click(function(){
	$('#profilePrompt').openModal();
});

$('#nameSubmit').submit(
	function(e){
		e.preventDefault();

		// catch the profile name the user entered
		name = $('#name').val().toLowerCase(); 

		// Check for at least one character
		if(!name.length){
			Materialize.toast('Enter at least one character', 2000, 'alert');
			return;
		}

		// check if profile name already exists
		if($.inArray(name,Object.keys(user.profiles)) != -1){
			Materialize.toast('Profile name already exists!', 2000, 'alert');
			return;
		}
		
		// profilename doesn't exists yet, proceed with selecting extensions for the new profile
		$('#profilePrompt').closeModal();

		// Make sure profileHeader is visible
		// $('#profileHeader').slideDown();

		// after half a second open the modal, user can specify what extensions to add to profile
		setTimeout(function(){
				addExtensions(name);
		}, 500);
	}
);

// add extensions to new profile modal
function addExtensions(name) { 
	$('#addExts').openModal({
		dismissible: false,
		ready: function() {
			checkboxlistener(name);
		}
	});

	let a = $('#addExts h4').text();
	// change H4 text to say "add extensions to [profile name]"
	$('#addExts h4').text(a + name); 
	
	// loop over extArray to populate the list
	for (let i = 0; i < extArray.length; i++) {
		let ext = extArray[i];
		$('#extList').append(extListTemplate(ext));
	}
}

function checkboxlistener() { 
	// turn on/off extensions when toggle is switched
	$('.extList-toggle input').change(function(){
		//get the extension id the user clicked
		let id = $(this).attr('appid'); 
		if ($.inArray(id, idList) != -1){
			let index = idList.indexOf(id);
			idList.splice(index, 1);
			return;
		}
		idList.push(id);
		// console.log('idList is now ',idList);
	});
}

$('#extSubmit').submit(
	function(e){
		e.preventDefault();
		//if no extension are selected, show toast warning and do not close modal
		if(idList.length === 0){
			Materialize.toast('You must select at least one extension for this profile', 2000, 'alert');
		} else {
			//extensions were selected
			submitThatShit(); //submitting extensions to memory
			$('#addExts h4').text("Add extensions to "); // turn h4 text back to normal after modal is dismissed
			$('#extList').html('');
			Materialize.toast(name +' profile added', 2000, 'ccToastOn');
			$('#addExts').closeModal(); //close the modal
			$('#profileHeader').slideDown();
		}
	}
);

function submitThatShit() {

	// profile name is in a global variable 'name'
	// extension id's are in a global variable 'idList'
	// tempObj[name] = idList;
	if (idList.length === 0) {
		return;
	}

	// set new profile on user obj, with idlist as array
	user.profiles[name] = idList;

	chrome.storage.sync.set(user, function () {
	  console.log('Saved', name, idList);

	  // get user data again, re-fill profiles
	  getUserData();

	  //emptying out idList so that extensions aren't added to future profiles
	  idList = []; 

	});
}

// check storage for user data
function getUserData() { 
	chrome.storage.sync.get(function(obj){

		// There should be a "profiles" property
		// we can check for that and assume that 
		// if it doesn't exist, then they're on the old version
		if(!obj.hasOwnProperty('profiles')){
			console.log('migrating user data...');
			fixStorage(obj);
			return;
		}

		// at this point, we're on the new data structure

		// set global user obj
		user = obj;

		// check if user has compact styles checked
		if(user.compactStyles){
			// toggle switch to on state
			$('.compact-styles-switch').attr('checked', true);

			// enable compact styles stylesheet
			$('#compactStylesheet')[0].disabled = false;

		}

		// check if user has dismissed profiles prompt
		if(user.dismissedProfilesPrompt && Object.keys(user.profiles).length === 0){
			// User has no profiles, and has dismissed profiles prompt
			$('#profileHeader').hide();
			// hide edit button (in options slide-down)
			$('.editBtn').hide();
		}

		let allProfiles = Object.keys(obj.profiles);

		if ( allProfiles.length === 0 ) { 
			// if there are no profiles, exit function
			$('#noProfilesText').show();
			// $('#profileHeader').css("background-color", "#03A9FA");
			$('.editBtn').hide();
			return;
		}

		// if there are between 1 and 4 profiles show addProfileBox
		else if ( allProfiles.length >= 1 && allProfiles.length <= 4 ) {
			$('#addProfileBox').show();
		}

		$('#noProfilesText').hide();
		$('#profileOnboarding').hide();
		$('#profileHeader').css("background-color", "#f3f3f3");
		$('.editBtn').show();

		// clear out html in profile-holder first
		$('.profile-holder').html('');

		// loop over all profiles
		// append them to the div
		for (let i = 0; i < allProfiles.length; i++) {
			let name = allProfiles[i];
			// console.log('name:', name)
			let btnHtml = "<button class='profile-btn off' id='"+name.toLowerCase().split(' ').join('_')+"'>"+name+"</button>";
			
			// append to profile-holder
			$('.profile-holder').append(btnHtml); 
		}
	});
}

// Not needed, listening to .addProfile instead
// $("body").on("click","#addProfileBox",function(){ // add a new profile box
// 	$('#profilePrompt').openModal();
// });


$("body").on("click",".editBtn",function(){
	$('#editProfiles').openModal({
		dismissible: false,
		ready: function() {},
	});

	for (let i = 0; i < Object.keys(user.profiles).length; i++) {
		$('#profileList').append(profileListTemplate(Object.keys(user.profiles)[i]));
	}

});


$('#removeAllBtn').click((e)=>{
	
	e.preventDefault();

	console.log('howiye or whatever');

	$('#confirmDeleteAll').openModal();

});

$("body").on("click", "#deleteAllProfiles", function(){
	
	// User confirms delete all profiles
	// remove all profiles (set empty object)
	user.profiles = {};

	// save in memory
	chrome.storage.sync.set(user, function () {
	  console.log('removed all profiles');
	});

	Materialize.toast('Deleting your profiles...', 2000, 'deleteToast');
	setTimeout(function(){
		location.reload(false); // adding false lets the page reload from the cache
	}, 1000);
});


$("body").on("click",".delete",function(){
	//when a profile delete button is clicked, get the name of the profile being deleted
	let profile = $(this).parent().attr('profile');

	//close the current modal, and clear out the profilesList
	$('#editProfiles').closeModal();
	$('#profileList').html('');

	//wait half a second, open a new confirm/cancel modal
	setTimeout(function(){
		confirmDelete(profile);
	}, 500);
});


let confirmDelete = function(profile){
	//open the modal and insert the profile name into the first p element
	$('#confirmDelete').openModal({
		complete: function(){
			$('#confirmDelete h6').html('Are you sure you want to delete ');
		}
	});

	$('#confirmDelete h6').append(profile);
	//on confirm
		//delete profile from storage, show toast confirming profile delete
	//on cancel
		//close the modal and do nothing
	$("body").on("click","#deleteProfile",function(){
		//delete the selected profile
		console.log('trying to remove ',profile," from storage");

		delete user.profiles[profile];

		chrome.storage.sync.set(user, function () {
		  console.log('Saved, deleted ', profile);
		});

		Materialize.toast('Deleting ' + profile, 2000, 'deleteToast');
		setTimeout(function(){
			location.reload(false);
		}, 1000);
	});
};



let profileName;
$("body").on("click",".edit",function(){
	
	//get profile name
	profileName = $(this).parent().attr('profile');
	console.log('user is editing: ',profileName);

	//close the current modal, and clear out the profilesList
	$('#editProfiles').closeModal();
	$('#profileList').html('');

	//prefill the profile name input with the current profile name
	$('#editProfileName').val(profileName);


	//populate list with all extensions:
	for (let i = 0; i < extArray.length; i++) {
		let ext = extArray[i];
		$('#editExtList').append(extListTemplate(ext));
	}

	// Loop over all id's in profile and tick the boxes that are already in the profile
	for (let i = 0; i < user.profiles[profileName].length; i++) {
		let id = user.profiles[profileName][i];
		idList.push(id);
		//find input with this id and add .prop('checked', true);
		$('#editExtList input[appid="'+id+'"]').prop('checked', true);
	}

	//start listening for checkbox changes
	checkboxlistener();

	//save button adds profile to Storage.
	//cancel button disregards changes

	//wait half a second, open a new confirm/cancel modal
	setTimeout(function(){
		$('#editExts').openModal({
			dismissible: false
		});
	}, 500);
});


$("#editExtSubmit").submit(function(e){
	e.preventDefault();

	//if no extension are selected, show toast warning and return
	if(idList.length === 0){
		Materialize.toast('You must select at least one extension for this profile', 2000, 'alert');
		return;
	}

	//if user has deleted the profile name, prompt them to enter something and return
	if($('#editProfileName').val()===''){
		Materialize.toast('You must enter a name for this profile', 2000, 'alert');
		return;
	}

	let newName = $('#editProfileName').val().toLowerCase();

	if(profileName === $('#editProfileName').val()){
		// user has NOT changed the profile name, so we can just set the idList as the profile
		chrome.storage.sync.remove(profileName, function(){
			Materialize.toast(name+' profile successfully edited', 1000, 'ccToastOn');
			setTimeout(function(){
				location.reload(false);

				//clear out the editExtList
				$('#editExtList').html('');

				//set new profile in storage with idList as array
				name = newName;
				submitThatShit();
			}, 1000);
		});
		$('#editExts').closeModal(); //close the modal

	}

	else {
		//user has updated the profile name, check if profile with this new name already exists
		chrome.storage.sync.get(function(obj){
			if ($.inArray(newName, Object.keys(obj)) != -1){
				Materialize.toast('Profile name already exists!', 2000, 'alert');
			}
			else {
				//new name is ok, delete old name from storage
				console.log('deleting old profile, '+profileName);
				chrome.storage.sync.remove(profileName, function(){
					Materialize.toast(name+' profile successfully edited', 1000, 'ccToastOn');
					setTimeout(function(){
						location.reload(false);

						//clear out the editExtList
						$('#editExtList').html('');

						//set new profile in storage with idList as array
						name = newName;
						submitThatShit();
					}, 1000);
				});
			}
		});
	}
});


$("body").on("click",".uninstallExt",function(e){

	// User wants to uninstall an extension
	// relevant docs:
	// https://developer.chrome.com/extensions/management#method-uninstall

	e.preventDefault();

	// get extension ID
	let id = $(e.currentTarget).parents('.ext-links').attr('data-extId');

	// uninstall, with native confirm dialog
	// even with false, an extension uninstalling an extension
	// will always trigger the native confirm dialog
	chrome.management.uninstall(id, {"showConfirmDialog": false}, ()=>{

		// do something when user has confirmed or denied?
		// will we need to refresh the list?
		// nope, the extension closes the popup.html anyway so nothing to worry about...

	});
});

$("body").on("click",".show-ext-links",function(e){
	// User wants to show the extension links

	e.preventDefault();

	// get refrence to relevant ext-links element
	let extLinks = $(this).parents('.righty').siblings('.ext-links');

	// Show ext-links
	extLinks.slideDown();

	// hide down arrow, show up arrow
	$(e.currentTarget).hide();
	$(e.currentTarget).siblings('.hide-ext-links').show();

});

$("body").on("click",".hide-ext-links",function(e){
	// User wants to hide the extension links

	e.preventDefault();

	// get refrence to relevant ext-links element
	let extLinks = $(this).parents('.righty').siblings('.ext-links');

	// Show ext-links
	extLinks.slideUp();

	// hide down arrow, show up arrow
	$(e.currentTarget).hide();
	$(e.currentTarget).siblings('.show-ext-links').show();

});

$("body").on("click","#dismissProfilePrompt",function(e){

	// User wants to dismiss the profiles onboarding

	e.preventDefault();

	// Hide call to actions, copy and buttons
	$('#profileHeader').hide();

	// Show user the modal to tell them they can still add a profile from the options modal
	$('#confirmDismissProfilePrompt').openModal();

	// Save this to chrome storage so we can use it on next page load and not show the profileheader again UNTIL user resets it in options page....?
	user.dismissedProfilesPrompt = true;

	chrome.storage.sync.set(user, function () {
	  console.log('Saved, profilesModal dismissed');
	});

});


function compactStylesListener() { 

	// turn on/off compact styles
	$('.compact-styles-switch').change(function(){

		// get reference to stylesheet
		let sheet = $('#compactStylesheet')[0];

		console.log('toggling styles, disabled: ',sheet.disabled);

		// Toggle disabled attribute
		sheet.disabled = !sheet.disabled;

		// save current state to storage
		user.compactStyles = !sheet.disabled;
		console.log("saving user: ", user);
		chrome.storage.sync.set(user);
		
	});
}

function includeAppsListener() { 

	// turn on/off show apps
	$('.include-apps-switch').change(function(e){

		console.log('toggling apps: ', e);

		if(e.target.checked){

			// user wishes to include apps
			$('.app').show();
			Materialize.toast('Apps now showing', 2000, 'ccToastOn');
		} else {
			// user wishes to hide all apps
			$('.app').hide();
			Materialize.toast('Apps will not be shown', 2000, 'ccToastOff');
		}

		user.includeApps = e.target.checked;
		// save current state to storage
		console.log("saving user: ", user);
		chrome.storage.sync.set(user);
		
	});
}


$('#viewChangelog').click(()=>{
	$('#changelogModal').openModal();
})



/* 
This function are for moving from v0.82 -> v0.83
We were storing profiles on the global sync object. We need to put them into a profiles property
We also need to add properties for compactStyles and dismissedProfilesPrompt
*/

function fixStorage(profiles){

	console.log('migrating data with:', profiles);

	// create new object
	let newObj = {
		"profiles": profiles || [],
		"dismissedProfilesPrompt": false,
		"compactStyles": false,
		"seenChangelog": 0.82
	};

	// clear the storage (We should have everything we need in the newObj)
	chrome.storage.sync.clear();

	chrome.storage.sync.set(newObj, function(){
		console.log('new object saved, user is "migrated"');
	});

	getUserData();

}

function onUpdate() {
    console.log("Extension Updated");
  }


// GOOGLE ANALYTICS

// Write a function that sends click events to Google Analytics:
function trackButtonClick(e) {
  _gaq.push(['_trackEvent', e.target.id, 'clicked']);
}

// And use it as an event handler for each button's click:
let buttons = document.querySelectorAll('button');
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', trackButtonClick);
}


// Handle install/updates
function onInstall() {
  console.log("Extension Installed");
}

function onUpdate() {
  console.log("Extension Updated");
}

function getVersion() {
  var details = chrome.app.getDetails();
  return details.version;
}

// Check if the version has changed.
let currVersion = getVersion();
let prevVersion = localStorage.version;
if (currVersion != prevVersion) {
  // Check if we just installed this extension.
  if (typeof prevVersion == 'undefined') {
    onInstall();
  } else {
    onUpdate();
  }
  localStorage.version = currVersion;
  // either way, show changelog modal
  $('#changelogModal').openModal();
}




