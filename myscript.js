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
	$('#addProfileBox').hide();

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
					keyUs = key.split(' ').join('_');
					$("#" + keyUs).addClass("on").removeClass("off");
					for (var n = 0; n < obj[key].length; n++) { // cycle through the extensions within the profile
						for (var i=0;i<extArray.length;i++) {
							if (extArray[i]["id"] === obj[key][n]) {
								if (extArray[i]["enabled"] === false) {
									$("#" + keyUs).removeClass("on").addClass("off");
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

		// no results - show card
		setTimeout(function(){
			if ( $(".extName:visible").length === 0 ){
				$("#noResults").fadeIn();
				$('#activeExtensions').parent().css('visibility','hidden');
				$('#inactiveExtensions').parent().css('visibility','hidden');
			} else {
				$("#noResults").hide();
				$('#activeExtensions').parent().css('visibility','visible');
				$('#inactiveExtensions').parent().css('visibility','visible');
			}
		}, 550)
		
	});

	$('#searchbox').keyup(function(){
		
	})
	$('#searchbox').focus();

// tooltipGenerator();
// setTimeout(function(){
// 	$('.tooltipped').tooltip();
// }, 1000)

}); // close $(document).ready



// after clicking a profile button toggle it's appearance (on or off) and cycle through associated extensions turning them all on or off
$("body").on("click",".profile-btn",function(){ // if a profile btn is clicked
	btnId = $(this).attr("id"); // find out which one and assign to btnId
	//btnIdConvert = btnId.split('_').join(' '); // lower case and replace underscore for space
	btnIdConvert = $(this).text();

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
		console.log('idList is now ',idList);
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
			var btnHtml = "<button class='profile-btn off' id='"+name.split(' ').join('_')+"'>"+name+"</button>";
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
			btnHtml = "<button class='profile-btn off' id='"+name.toLowerCase().split(' ').join('_')+"'>"+name+"</button>";
			$('.profile-holder').append(btnHtml); // append to profile-holder
		}
	})
}

$("body").on("click","#addProfileBox",function(){ // add a new profile box
	$('#profilePrompt').openModal();
})

$("body").on("click","#editBtn",function(){ 
	$('#editProfiles').openModal({
		dismissible: false,
		ready: function() {},
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


$("body").on("click",".delete",function(){
	//when a profile delete button is clicked, get the name of the profile being deleted
	var profile = $(this).parent().attr('profile');

	//close the current modal, and clear out the profilesList
	$('#editProfiles').closeModal();
	$('#profileList').html('');

	//wait half a second, open a new confirm/cancel modal
	setTimeout(function(){
		confirmDelete(profile);
	}, 500)
})


var confirmDelete = function(profile){
	//function for confirming profile delete

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
		chrome.storage.sync.remove(profile);
		Materialize.toast('Deleting ' + profile, 2000, 'deleteToast')
		setTimeout(function(){
			location.reload(false);
		}, 1000)
	})
}



var profileName;
$("body").on("click",".edit",function(){
	//get profile name
	var profile = $(this).parent().attr('profile');
	console.log('user is editing: ',profile);

	//close the current modal, and clear out the profilesList
	$('#editProfiles').closeModal();
	$('#profileList').html('');

	//prefill the profile name input with the current profile name
	$('#editProfileName').val(profile);

	//populate list with all extensions:
	extArray.forEach(function(ext){ // loop over extArray to populate the list
		$('#editExtList').append(extListTemplate(ext));
	})

	//get the profile form memory, and populate the idList with the resulting array
	chrome.storage.sync.get(profile,function(obj){
		idList = obj[profile];
		//console.log('idList: ',idList);

		//loop over each id in idList and set the appropriate extension input as active?
		idList.forEach(function(id) {
			//find input with this id and add .prop('checked', true);
			$('#editExtList input[appid="'+id+'"]').prop('checked', true);
		});

		//start listening for checkbox changes:
		checkboxlistener();
	})
	

	//save button adds profile to Storage. 
	//cancel button disregards changes

	//wait half a second, open a new confirm/cancel modal
	setTimeout(function(){
		$('#editExts').openModal({
			dismissible: false
		});
	}, 500)
})


$("#editExtSubmit").submit(
	function(e){
		e.preventDefault(); //preventing default submit button behaviour

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

		var newName = $('#editProfileName').val().toLowerCase();

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
				}, 1000)	
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
						}, 1000)
					});
				}
			})
		}
	}
)


// GOOGLE ANALYTICS

// Write a function that sends click events to Google Analytics:
function trackButtonClick(e) {
  _gaq.push(['_trackEvent', e.target.id, 'clicked']);
};

// And use it as an event handler for each button's click:
var buttons = document.querySelectorAll('button');
for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', trackButtonClick);
}

// TOOLTIPS

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


