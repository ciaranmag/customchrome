// Declare variables using 'var' once minifying the code

var extArray = [],
activeExtensions = [],
inactiveExtensions = [],
btnId,
idList = [],

// Handlebars for active and inactive lists
source   = $("#entry-template").html(),
template = Handlebars.compile(source),

// Handlebars for extList (modal for adding extensions to profiles)
extListSource   = $("#extList-template").html(),
extListTemplate = Handlebars.compile(extListSource);

// Handlebars for profileList (modal for editing profiles)
profileListSource   = $("#profileList-template").html(),
profileListTemplate = Handlebars.compile(profileListSource);


$(document).ready(function(){

	getProfiles(); // call function to check storage.sync for existing user profiles

	$('.modal-trigger').leanModal();
	$('#removeAllBtn, #addProfileBox').hide();

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
				for (key in obj) { // cycle through the extension profiles
					$("#" + key).addClass("on").removeClass("off");
					for (var n = 0; n < obj[key].length; n++) { // cycle through the extensions within the profile
						for (var i=0;i<extArray.length;i++) {
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

// tooltipGenerator();
// setTimeout(function(){
// 	$('.tooltipped').tooltip();
// }, 1000)

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
			})
			Materialize.toast(btnIdConvert+' is now off', 2000, 'ccToastOff')
		})
	$(this).removeClass("on").addClass("off"); // change profile btn to "off" appearance
	setTimeout(function(){
		location.reload(false); // adding false lets the page reload from the cache
	}, 1000)
	}

	else if ($(this).hasClass("off")) { // if the btn is currently off then turn all extensions on
		chrome.storage.sync.get(function(obj){
			Object.keys(obj).forEach(function(key){
				if (key === btnIdConvert) {
					for (var i = 0; i < obj[btnIdConvert].length; i++) {
						chrome.management.setEnabled(obj[btnIdConvert][i], true, function (){})
					}
				}
			})
			Materialize.toast(btnIdConvert+' is now on', 2000, 'ccToastOn')
		})
	$(this).removeClass("off").addClass("on"); // change profile btn to "on" appearance
	setTimeout(function(){
		location.reload(false); // adding false lets the page reload from the cache
	}, 1000)
	}

})

function extStateListener() { // turn on/off extensions when toggle is switched
	$('.js-switch').change(function(){
		var id = $(this).parents('.switch').attr('id'), // get the app id
				name = $(this).parents('.switch').attr('name'); // get the app name
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
		$('#profilePrompt').openModal();
	});

$('#nameSubmit').submit(
	function(e){
		e.preventDefault();
		name = $('#name').val().toLowerCase(); // catch the profile name the user entered
		// // check if it's a valid name
		
		// var reg = /[a-zA-z0-9\s]+/;
		// var patt = new RegExp(/[a-zA-z0-9\s]+/);

		// if ( patt.test(name) === false ) {
		// 	console.log("damn")
		// 	Materialize.toast('Profile names must be between 1 and 15 characters and only include letters, numbers, and spaces', 3000, 'alert');
		// 	return;
		// }
		
		chrome.storage.sync.get(function(obj){
			if ($.inArray(name, Object.keys(obj)) != -1){
				Materialize.toast('Profile name already exists!', 2000, 'alert');
				return;
			} else {
				// profilename doesn't exists yet, proceed with selecting extensions for the new profile 
				$('#profilePrompt').closeModal();
				// after half a second open the modal, user can specify what extensions to add to profile
				setTimeout(function(){
						addExtensions(name);
				}, 500) 
			}
		})
	}
)

function addExtensions(name) { // add extensions to new profile modal
	$('#addExts').openModal({
		dismissible: false,
		ready: function() {
			checkboxlistener(name)
		}
	});

	var a = $('#addExts h4').text();
	$('#addExts h4').text(a + name); // change H4 text to say "add extensions to [profile name]"
	extArray.forEach(function(ext){ // loop over extArray to populate the list
		$('#extList').append(extListTemplate(ext));
	})
}

function checkboxlistener() { // turn on/off extensions when toggle is switched
	$('.extList-toggle input').change(function(){
		var id = $(this).attr('appid'); //get the extension id the user clicked
		if ($.inArray(id, idList) != -1){
			var index = idList.indexOf(id);
			idList.splice(index, 1);
			return;
		}
		idList.push(id);
	})
}

$('#extSubmit').submit(
	function(e){
		e.preventDefault(); //preventing default submit button behaviour
		//if no extension are selected, show toast warning and do not close modal
		if(idList.length === 0){
			Materialize.toast('You must select at least one extension for this profile', 2000, 'alert');
		} else {
			//extensions were selected 
		submitThatShit(); //submitting extensions to memory
		$('#addExts h4').text("Add extensions to "); // turn h4 text back to normal after modal is dismissed
		$('#extList').html('');
		Materialize.toast(name+' profile added', 2000, 'ccToastOn');
		$('#addExts').closeModal(); //close the modal
		}
	}
)

function submitThatShit() {
	tempObj = {};
	tempObj[name] = idList;
	if (idList.length === 0) {
		return;
	};
	chrome.storage.sync.set(tempObj, function () {
	  console.log('Saved', name, idList);
	  chrome.storage.sync.get(function(obj){
	  	var allKeys = Object.keys(obj);
	  	if ( allKeys.length === 1 ) {
	  		$('#noProfilesText').hide();
				$('#profileHeader').css("background-color", "#f3f3f3");
				$('#editBtn').show();
				$('#addProfileBox').show();
	  	}
	  	else if ( allKeys.length >= 5 ) {
				$('#addProfileBox').hide();
			}
	  	
			// HTML code for profile btn changing string to lower case and replacing spaces with underscores
			var btnHtml = "<a class='profile-btn off' id='"+name.split(' ').join('_')+"'>"+name+"</a>";
			$('.profile-holder').append(btnHtml); // append new button with new profile name to profile-holder
			$('#name').val(""); // set profile name to user-defined profile name
	  })
	  idList = []; //emptying out idList so that extensions aren't added to future profiles

		// tooltipGenerator();
		// setTimeout(function(){
		// 	$('.tooltipped').tooltip();
		// }, 1000)

	})
}

function getProfiles() { // check storage for any profiles
	chrome.storage.sync.get(function(obj){
		var allKeys = Object.keys(obj);

		if ( allKeys.length === 0 ) { // if there are no profiles, exit function
			$('#noProfilesText').show();
			$('#profileHeader').css("background-color", "#03A9FA");
			$('#editBtn').hide();
			return;
		}

		// if there are between 1 and 4 profiles show addProfileBox
		else if ( allKeys.length >= 1 && allKeys.length <= 4 ) {
			$('#addProfileBox').show();
		}


		$('#noProfilesText').hide();
		$('#profileHeader').css("background-color", "#f3f3f3");
		$('#editBtn').show();

		for (var i = 0; i < allKeys.length; i++) {
			var name = allKeys[i],
					btnHtml = "<a class='profile-btn off' id='"+name.toLowerCase().split(' ').join('_')+"'>"+name+"</a>";
			$('.profile-holder').append(btnHtml); // append to profile-holder
		}
	})
}

$("body").on("click","#addProfileBox",function(){ // box next to existing profiles to add a new profile
	$('#profilePrompt').openModal();
})

$("body").on("click","#editBtn",function(){ // show edit profile options and remove all
	// if ($(this).hasClass("editHidden")) {
	// 	$('#removeAllBtn').show();
	// 	$(".editHidden").removeClass("editHidden").addClass("editShown");
	// }
	// else if ($(this).hasClass("editShown")) {
	// 	$('#removeAllBtn').hide();
	// 	$(".editShown").removeClass("editShown").addClass("editHidden");
	// }


$('#editProfiles').openModal({
	dismissible: false,
	ready: function() {}
});


chrome.storage.sync.get(function(obj){
	for (var i = 0; i < Object.keys(obj).length; i++) {
		$('#profileList').append(profileListTemplate(Object.keys(obj)[i]));
	};
})

})

$("body").on("click","#removeAllBtn",function(){ // remove all profiles
	chrome.storage.sync.clear()
	Materialize.toast('Deleting your profiles...', 2000, 'deleteToast')
	setTimeout(function(){
		location.reload(false); // adding false lets the page reload from the cache
	}, 1000)
})




$("body").on("click","#delete-" + name.toLowerCase().split(' ').join('_'),function(){ // remove associated profile
	var nameOfProfile // get profile name from id of previous button and parse 
	chrome.storage.sync.remove(nameOfProfile)
	Materialize.toast('Deleting ' + nameOfProfile, 2000, 'deleteToast')
	setTimeout(function(){
		location.reload(false); // adding false lets the page reload from the cache
	}, 1000)
})

// delete button needs to be created with id delete+name
// append to button after created
// hide button
// display button after clicking
// btnHtml = "<a class='delete-btn' id='#delete-"+name.toLowerCase().split(' ').join('_')+"'>delete</a>";




// var tooltipGenerator = function(){
// 	var ttArray = [];
// 	//make a call to sync to get the profiles currently stored.
// 	chrome.storage.sync.get(function(obj){
// 		//looping over all the profiles returned from storage
// 		Object.keys(obj).forEach(function(key){
// 			//looping over each extension id in the profile
// 			for (var i = 0; i < obj[key].length; i++) {
// 				var id = obj[key][i];
// 				//looping over the extArray, when id in profile matches an id in the extArray, get the shortname and push to ttArray
// 				for (var i = 0; i < extArray.length; i++) {
// 					if (extArray[i].id === id) {
// 						ttArray.push(extArray[i].shortName);
// 						break;
// 					}
// 				};
// 			}
// 			var proNameId = key.split(' ').join('_')
// 			// console.log("tooltip info: " + proNameId, ttArray);
// 			//find the appropriate profile button and set the data-tooltip attribute with ttArray as value
// 			$("#" + proNameId).attr('data-tooltip',ttArray).attr('data-position','bottom').attr('delay', 50).addClass("tooltipped");
// 			ttArray =[];
// 		})
// 	})
// }






