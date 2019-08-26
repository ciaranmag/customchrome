// Declare variables
let extArray = [],
appArray = [],
activeExtensions = [],
inactiveExtensions = [],
idList = [],
user = {},
justExtIds = [],

// Handlebars for active and inactive lists
source   = $("#entry-template").html(),
template = Handlebars.compile(source),

// Handlebars for extList (modal for adding extensions to groups)
extListSource   = $("#extList-template").html(),
extListTemplate = Handlebars.compile(extListSource),

// Handlebars for groupList (modal for editing groups)
groupListSource   = $("#groupList-template").html(),
groupListTemplate = Handlebars.compile(groupListSource);

const customChromeId = 'balnpimdnhfiodmodckhkgneejophhhm';
// Finish declaring variables

// Handlebars Helpers
Handlebars.registerHelper('lowerStripJoin', function(groupName) {
	return groupName.toLowerCase().split(' ').join('_');
});


$(function() {
	
	// listen for compact styles toggle change
	compactStylesListener();

	// listen for include apps toggle
	includeAppsListener();

	$('.modal-trigger').leanModal();

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
					extArray.push(entry);
					entry.isApp = '<span class="new badge"></span>';
					// console.log("PACKAGE", entry);
					break;
				default:
					console.log("This is different", entry);
			}
		}

		// call function to check storage.sync for existing user groups
		getUserData();

		// sort extArray into alphabetical order based on the extensions' names
		extArray.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});
		
		justExtIds = [];
		
		// loop over extArray, sort icons, append to appropriate element
		for (let i = 0; i < extArray.length; i++) {
			let entry = extArray[i];
			
			// Make an array of all the extension ids
			justExtIds.push(entry.id);
			
			// extension icons are stored in entry.icons, but not all extensions have icons
			if (entry.icons === undefined) {
				imgsrc = 'images/icon-128.png';  // if there aren't any icons, use our default icon
			} else {
				// if there is an array of icons, we want the highest res one (which is the last one in the array) so get the array length (-1) to get the last icon then set that item's url as our app icon url
				imgsrc = entry.icons[entry.icons.length-1].url;
			}
			entry.pic = imgsrc; // setting the url we just got as entry.pic
			
			let state = entry.enabled;
			state ? state = "checked" : state = "";
			entry.stringEnabled = state;
			
			// Check if extension is sideloaded
			entry.installType === "development" ? entry.sideloaded = true : 0;
			
			// divide the extensions into two separate lists of active (enabled = true) and inactive (enabled = off) and output them into the appropriate HTML div
			// console.log("entry:", entry)
			if (entry.enabled) {
				$('#activeExtensions').append(template(entry));
			} else {
				$('#inactiveExtensions').append(template(entry));
			}
		} // close extArray loop
		
		// hide on/off switch for Custom Chrome extension
		$('#balnpimdnhfiodmodckhkgneejophhhm')[0].children[0].style.visibility = 'hidden';
		
		// run the function which listens for a change in a checkbox state
		extStateListener();

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
				$(el).fadeOut();
			} else {
				$(el).fadeIn();
			}
		});

		// if the search returns no results then show the no results card
		setTimeout(function(){
			if ( $(".extName:visible").length === 0 ){
				$("#noResults").fadeIn();
				$('#activeExtensions, #inactiveExtensions').parent().css('visibility','hidden');
				$('.allExtensionsContainer').css({'visibility':'hidden', 'height':'0px'});
				// fill in text
				$('#noResults .filterLink .search-failed-text').text(filter);
				// update url
				$('#noResults a.filterLink').attr("href", "https://chrome.google.com/webstore/search/"+encodeURIComponent(filter));
			} else {
				$("#noResults").hide();
				$('.allExtensionsContainer').css({'visibility':'visible', 'height':'auto'});
				$('#activeExtensions, #inactiveExtensions').parent().css('visibility','visible');
			}
		}, 500);

	});

	$('#searchbox').focus();

}); // close $(document).ready

// Add active and inactive extension count next to card title
function getExtensionCount() {
	if (user.includeApps) {
		$('#activeCount').text($('#activeExtensions').children('.extBlock').length);
		$('#inactiveCount').text($('#inactiveExtensions').children('.extBlock').length);

	} else if (!user.includeApps) {
		$('#activeCount').text($('#activeExtensions').children('.extBlock:not(.app)').length);
		$('#inactiveCount').text($('#inactiveExtensions').children('.extBlock:not(.app)').length);
	}
}

function handleGroupsClasses(){
	// setting the group buttons to on/off appearance
	
	for (let group in user.groups) {
		// for each group, get all extension id's in that group
		// if they are all on, add class "on" to element
		// otherwise, leave it grey
		let extensionIds = user.groups[group];

		let tempArray = [];

		for (let i = extensionIds.length -1; i>=0; i--) {
			let id = extensionIds[i];
			for (let x = 0; x < extArray.length; x++) {
				let obj = extArray[x];
				obj.id === id ? tempArray.push(obj) : 0;
			}
			// check if the extension is still installed by the user
			if (justExtIds.indexOf(id) == -1) {
				user.groups[group].splice(user.groups[group].indexOf(id),1);
			}
		}

		// tempArray now contains extension objects for this group

		// finds if any of the extensions have enabled === false
		// if even one extension is off, then the group is inactive
		let off = tempArray.some(function(ext){
			return ext.enabled === false;
		}) || false;

		// if it's on, add/remove appropriate classes
		if (!off) {
			group = group.replace(/ /g, "_");
			$("#" + group).removeClass("off").addClass("on");
		}
	}
	chrome.storage.sync.set(user, function () {});
}


// after clicking a group's on/off button, we toggle its appearance (on or off) and cycle through associated extensions turning them all on or off
$("body").on("click",".group-btn",function(){ // if a group btn is clicked
	
	// cache button in local variable
	// so we don't repeatedly poll the DOM for the element
	let btn = $(this);

	// find out which extension was clicked and assign to btnId
	let groupClicked = btn.attr("id").replace(/_/g, " ")

	// check if group was on or off
	if (btn.hasClass("on")) { 

		// It was on, turn all extensions off
		// Loop over each extension in the group
		user.groups[groupClicked].forEach(function(extensionId){

			// Check to see if this extension lives in any of the groups that are still on
			let keepOn = false;

			// Get all group names that are on (have .on class)
			let activeGroups = [];
			for (let i = $('.group-btn.on').length - 1; i >= 0; i--) {
				let groupName = $($('.group-btn.on')[i]).attr('id');
				
				groupName = groupName.replace(/_/g, " ");
				// ignore the groupClicked group
				groupName != groupClicked ? activeGroups.push(groupName) : false;
			}

			// for each group in activeGroups array
			// search the ids in its group
			// if we get a match, then keepOn = true
			for (let i = activeGroups.length - 1; i >= 0; i--) {
				keepOn = user.groups[activeGroups[i]].some(function(extId){
					return extId === extensionId;
				});
			}

			// this extension mustn't be in any other active group
			// turn it off
			!keepOn ? chrome.management.setEnabled(extensionId, false) :0;
			
		});

		Materialize.toast(groupClicked + ' is now off', 2000, 'ccToastOff');

		// change group btn to "off" appearance
		$(this).removeClass("on").addClass("off"); 
		setTimeout(function(){
			// adding false lets the page reload from the cache
			location.reload(false); 
		}, 500);
	} 
	else if (btn.hasClass("off")) { 
		// if the btn is currently off then turn all extensions on
		user.groups[groupClicked].forEach(function(extensionId){
			console.log('enabling extension:', extensionId);
			chrome.management.setEnabled(extensionId, true);
		});

		Materialize.toast(groupClicked + ' is now on', 2000, 'ccToastOn');

		// change group btn to "on" appearance
		$(this).removeClass("off").addClass("on"); 
		setTimeout(function(){
			// adding false lets the page reload from the cache
			location.reload(false); 
		}, 500);
	}

	// track that the user has toggled a group
	ga('send', 'event', "groups", "group-toggled");

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

// listen for addGroup button press, add a button to HTML, prompt for group name, set that name as button text, add that group to the storage.sync object
$('.addGroup').click(function(){
	$('#groupPrompt').openModal({
		ready: function () {
			$('#name').focus();
		},
		complete: function() {
			$('#name').val('');
		}
	});
});

$('#nameSubmit').submit(
	function(e){
		e.preventDefault();

		// catch the group name the user entered
		name = $('#name').val().toLowerCase(); 

		// Check for at least one character
		if(!name.length){
			Materialize.toast('Enter at least one character', 2000, 'alert');
			return;
		}

		// check if group name already exists
		if($.inArray(name,Object.keys(user.groups)) != -1){
			Materialize.toast('Group name already exists!', 2000, 'alert');
			return;
		}
		
		// groupname doesn't exists yet, proceed with selecting extensions for the new group
		$('#groupPrompt').closeModal();

		// Make sure groupHeader is visible
		// $('#groupHeader').slideDown();

		// after half a second open the modal, user can specify what extensions to add to group
		setTimeout(function(){
				addExtensions(name);
		}, 500);
	}
);

// add extensions to new group modal
function addExtensions(name) { 
	$('#addExts').openModal({
		dismissible: true,
		ready: function() {
			checkboxListener();
		},
		complete: function () {
			console.log('were in');
			$('#extList').html('');
			idList = [];
		}
	});

	let a = $('#addExts h4').text();
	// change H4 text to say "add extensions to [group name]"
	$('#addExts h4').text(a + name); 
	
	// loop over extArray to populate the list
	for (let i = 0; i < extArray.length; i++) {
		// don't include custom chrome
		if (extArray[i].id === 'balnpimdnhfiodmodckhkgneejophhhm') {
			continue;
		}
		let ext = extArray[i];
		$('#extList').append(extListTemplate(ext));
	}

	// clear out name variable
	$('#name').val('');
}

function checkboxListener() { 
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
		if (idList.length === 0) {
			Materialize.toast('You must select at least one extension for this group', 2000, 'alert');
		} 
		else {
			//extensions were selected
			submitThatShit(); //submitting extensions to memory
			$('#addExts h4').text("Add extensions to "); // turn h4 text back to normal after modal is dismissed
			$('#extList').html('');
			Materialize.toast(name +' group added', 2000, 'ccToastOn');
			$('#addExts').closeModal(); //close the modal
			$('#groupHeader').slideDown();
		}
	}
);

function submitThatShit() {

	// group name is in a global variable 'name'
	// extension id's are in a global variable 'idList'
	if (idList.length === 0) {
		return;
	}

	// turn all selected extensions on
	idList.forEach(function(extensionId, index) {
		chrome.management.setEnabled(extensionId, true);
	});

	/* TODO: REFRESH THE LIST AFTER CREATING A NEW GROUP AND TURNING EXTENSIONS ON */

	// set new group on user obj, with idlist as array
	user.groups[name] = idList;

	chrome.storage.sync.set(user, function () {
	  console.log('Saved', name, idList);

	  // get user data again, re-fill groups
	  getUserData();

	  //emptying out idList so that extensions aren't added to future groups
	  idList = []; 

	});

	// Track event in Google
	ga('send', 'event', "groups", "group-added");

	setTimeout(function () {
		// adding false lets the page reload from the cache
		location.reload(false);
	}, 500);

}

// check storage for user data
function getUserData() { 
	chrome.storage.sync.get(function(obj){

		// There should be a "groups" property
		// we can check for that and assume that 
		// if it doesn't exist, then they're on the old version
		if(!obj.hasOwnProperty('groups')){
			console.log('migrating user data...');
			fixStorage(obj);
			return;
		}

		// at this point, we're on the new data structure

		// set global user obj
		user = obj;
		console.log("user:", user);

		// check if user has compact styles checked
		if(user.compactStyles){
			// toggle switch to on state
			$('.compact-styles-switch').attr('checked', true);

			// enable compact styles stylesheet
			$('#compactStylesheet')[0].disabled = false;
		}

		// check if user has dismissed groups prompt
		if(user.dismissedProfilesPrompt && Object.keys(user.groups).length === 0){
			// User has no groups, and has dismissed groups prompt
			$('#groupHeader').hide();
			// hide edit button (in options slide-down)
			$('.editBtn').hide();
		}

		// hide apps if user has toggled that option
		if(!user.includeApps){
			// hide apps
			$('.app').hide();
			$('#searchbox').attr('placeholder','Search extensions');
			getExtensionCount();
		} else {
			// set toggle switch to checked
			$('.include-apps-switch').attr('checked', true);
			$('#searchbox').attr('placeholder','Search extensions and apps');
			getExtensionCount();
		}

		// Check if there's a toast to show
		if(user.showToast && user.showToast.length) {
			// show toast
			Materialize.toast(user.showToast, 2000, 'deleteToast');
			// empty out the showToast property
			user.showToast = "";
			chrome.storage.sync.set(user, function(){
				console.log('deleted showToast:', user);
			});
		}


		let allProfiles = Object.keys(obj.groups);

		if ( allProfiles.length === 0 ) { 
			// if there are no groups, exit function
			$('#noGroupsText').show();
			$('.editBtn').hide();
			return;
		}

		$('#noGroupsText, #groupOnboarding').hide();
		$('.editBtn').show();

		// clear out html in group-holder first
		$('.group-holder').html('');

		// loop over all groups
		// append them to the div
		for (let i = 0; i < allProfiles.length; i++) {
			let name = allProfiles[i];

			let btnHtml = "<button class='group-btn off' id='"+name.toLowerCase().split(' ').join('_')+"'>"+name+"</button>";
			
			// append to group-holder
			$('.group-holder').append(btnHtml); 
		}

		// remove Custom Chrome from user's existing groups to prevent them from unintentionally turning off the extension
		Object.keys(user.groups).forEach(function (key) {
			// console.log(key, user.groups[key]);
			user.groups[key] = arrayRemove(user.groups[key], 'balnpimdnhfiodmodckhkgneejophhhm');
			user.groups[key] == '' ? delete user.groups[key] :0;
			chrome.storage.sync.set(user);
		});

		handleGroupsClasses();

		// addGroupLabels(user.groups);

	});
}

function addGroupLabels(groups){
	// console.log('adding labels to extensions for groups:', groups);

	// loop over all groups
	for (let group in groups) {
	  if (Object.prototype.hasOwnProperty.call(groups, group)) {
	    // console.log(`group: ${group}: `+groups[group]);
	    // for each id in the group
	    // find the switch with that ID
	    // then find its parent('.entry')
	    // then find its child group.badges
	    // append the name to that element
	    groups[group].forEach(function (id) {
	      // console.log(id);
	      let target = $(`#${id}`).parents('.extBlock').find('.extName');
	      // console.log('target:', target);
	      let spanHtml = "<span class='groupLabel'>"+group+"</span>";
	      target.append(spanHtml);
	    });
	  }
	}
}


$("body").on("click",".editBtn",function(){
	$('#editGroups').openModal({
		// dismissible: true,
		ready: function() {},
	});

	for (let i = 0; i < Object.keys(user.groups).length; i++) {
		$('#groupList').append(groupListTemplate(Object.keys(user.groups)[i]));
	}

});


$('#removeAllBtn').click((e)=>{
	e.preventDefault();
	$('#confirmDeleteAll').openModal();
});

$("body").on("click", "#deleteAllGroups", function(){
	
	// User confirms delete all groups
	// remove all groups (set empty object)
	user.groups = {};

	// save in memory
	chrome.storage.sync.set(user, function () {
	  console.log('removed all groups');
	});

	Materialize.toast('Deleting your groups...', 2000, 'deleteToast');
	setTimeout(function(){
		location.reload(false); // adding false lets the page reload from the cache
	}, 1000);
});


$("body").on("click",".delete",function(){
	//when a group delete button is clicked, get the name of the group being deleted
	let group = $(this).parent().attr('group');

	//close the current modal, and clear out the groupsList
	$('#editGroups').closeModal();
	$('#groupList').html('');

	//wait half a second, open a new confirm/cancel modal
	setTimeout(function(){
		confirmDelete(group);
	}, 500);
});


function confirmDelete(group){
	//open the modal and insert the group name into the first p element
	$('#confirmDelete').openModal({
		complete: function(){
			$('#confirmDelete h6').html('Are you sure you want to delete ');
		}
	});

	$('#confirmDelete h5').append(group + "?");
	//on confirm - delete group from storage, show toast confirming group delete
	//on cancel - close the modal and do nothing
	$("body").on("click","#deleteGroup",function(){

		delete user.groups[group];

		// add property to user object that will be used to show 
		// "group delete" toast when extension reloads
		user.showToast = `${group} successfully deleted`;

		chrome.storage.sync.set(user);

		Materialize.toast('Deleting ' + group, 2000, 'deleteToast');
		setTimeout(function(){
			location.reload(false);
		}, 1000);
	});
}



let groupName;
$("body").on("click",".edit",function(){
	
	//get group name
	groupName = $(this).parent().attr('group');
	console.log('user is editing: ',groupName);

	//close the current modal, and clear out the groupsList
	$('#editGroups').closeModal();
	$('#groupList').html('');

	//prefill the group name input with the current group name
	$('#editGroupName').val(groupName);

	//populate list with all extensions:
	for (let i = 0; i < extArray.length; i++) {
		if (extArray[i].id === 'balnpimdnhfiodmodckhkgneejophhhm') {
			continue;
		}
		let ext = extArray[i];
		$('#editExtList').append(extListTemplate(ext));
	}

	// Loop over all id's in group and tick the boxes that are already in the group
	for (let i = 0; i < user.groups[groupName].length; i++) {
		let id = user.groups[groupName][i];
		idList.push(id);
		//find input with this id and add .prop('checked', true);
		$('#editExtList input[appid="'+id+'"]').prop('checked', true);
	}

	//start listening for checkbox changes
	checkboxListener();

	//save button adds group to Storage.
	//cancel button disregards changes

	//wait half a second, open a new confirm/cancel modal
	setTimeout(function(){
		$('#editExts').openModal({
			dismissible: true,
			complete: function() {
				$('#editExtList').html('');
			}
		});
	}, 500);
});


$("#editExtSubmit").submit(function(e){
	e.preventDefault();

	//if no extension are selected, show toast warning and return
	if(idList.length === 0){
		Materialize.toast('You must select at least one extension for this group', 2000, 'alert');
		return;
	}

	//if user has deleted the group name, prompt them to enter something and return
	if($('#editGroupName').val()===''){
		Materialize.toast('You must enter a name for this group', 2000, 'alert');
		return;
	}

	let newName = $('#editGroupName').val().toLowerCase();

	if(groupName === $('#editGroupName').val()){
		// user has NOT changed the group name, so we can just set the idList as the group
		chrome.storage.sync.remove(groupName, function(){
			Materialize.toast(newName+' group successfully edited', 1000, 'ccToastOn');
			setTimeout(function(){
				location.reload(false);

				//clear out the editExtList
				$('#editExtList').html('');

				//set new group in storage with idList as array
				name = newName;
				submitThatShit();
			}, 1000);
		});
		$('#editExts').closeModal(); //close the modal

	}

	else {
		//user has updated the group name, check if group with this new name already exists
		chrome.storage.sync.get(function(obj){
			if ($.inArray(newName, Object.keys(obj)) != -1){
				Materialize.toast('Group name already exists!', 2000, 'alert');
			}
			else {
				//new name is ok, delete old name from storage
				console.log('deleting old group, '+groupName);
				chrome.storage.sync.remove(groupName, function(){
					Materialize.toast(newName+' group successfully edited', 1000, 'ccToastOn');
					setTimeout(function(){
						location.reload(false);

						//clear out the editExtList
						$('#editExtList').html('');

						//set new group in storage with idList as array
						name = newName;
						submitThatShit();
					}, 1000);
				});
			}
		});
	}

	// Track event in Google
	ga('send', 'event', "groups", "group-edited");

});


$("body").on("click",".uninstallExt",function(e){
	e.preventDefault();

	// User wants to uninstall an extension
	// relevant docs: https://developer.chrome.com/extensions/management#method-uninstall
	// get extension ID
	let id = $(e.currentTarget).parents('.row.buttons').attr('data-extid');

	// uninstall, with native confirm dialog
	// even with false, an extension uninstalling an extension
	// will always trigger the native confirm dialog
	chrome.management.uninstall(id, {"showConfirmDialog": false}, ()=>{
		for (let [group_name, group_ids] of Object.entries(user.groups)){
			if (group_ids.indexOf(id) != -1) {
				user.groups[group_name].splice(group_ids.indexOf(id), 1);
			}
		}
		chrome.storage.sync.set(user, function () {});
	});
	// custom chrome closes automatically
});

$("body").on("click",".show-ext-links",function(e){
	e.preventDefault();
	// User wants to show the extension links
	// get refrence to relevant ext-links element
	let extLinks = $(this).parents('.righty').siblings('.ext-links');

	// Show ext-links
	extLinks.slideDown();

	// hide down arrow, show up arrow
	$(e.currentTarget).hide();
	$(e.currentTarget).siblings('.hide-ext-links').show();
});

$("body").on("click",".hide-ext-links",function(e){
	e.preventDefault();
	// User wants to hide the extension links
	// get refrence to relevant ext-links element
	let extLinks = $(this).parents('.righty').siblings('.ext-links');

	// Show ext-links
	extLinks.slideUp();

	// hide down arrow, show up arrow
	$(e.currentTarget).hide();
	$(e.currentTarget).siblings('.show-ext-links').show();
});

$("body").on("click","#dismissGroupPrompt",function(e){
	e.preventDefault();
	// User wants to dismiss the groups onboarding
	// Hide call to actions, copy and buttons
	$('#groupHeader').hide();

	// Show user the modal to tell them they can still add a group from the options modal
	$('#confirmDismissGroupPrompt').openModal();

	// Save this to chrome storage so we can use it on next page load and not show the groupheader again UNTIL user resets it in options page....?
	user.dismissedProfilesPrompt = true;

	chrome.storage.sync.set(user, function () {
	  console.log('Saved, groupsModal dismissed');
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

		// Track event in Google
		ga('send', 'event', "options", `compact-styles-toggled-to-${user.compactStyles}`);
		
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
			$('#searchbox').attr('placeholder', 'Search extensions and apps');
		} else {
			// user wishes to hide all apps
			$('.app').hide();
			Materialize.toast('Apps will not be shown', 2000, 'ccToastOff');
			$('#searchbox').attr('placeholder', 'Search extensions');
		}

		user.includeApps = e.target.checked;
		getExtensionCount();
		// save current state to storage
		console.log("saving user: ", user);
		chrome.storage.sync.set(user);

		// Track event in Google
		ga('send', 'event', "options", `include-apps-toggled-to-${user.includeApps}`);
	});
}

function showChangeLog() {
	let changelogHTML = '<hr>';
	for (let [key, value] of Object.entries(changelog)) {
		changelogHTML += '<h6>'+key+'</h6><ul>';
		value.forEach(function(item) {
			changelogHTML += '<li>'+item+'</li>';
		});
		changelogHTML += '</ul>';
	}
	$('#changelogModal .modal-content')[0].innerHTML += changelogHTML;
	$('#changelogModal').openModal();
}

$('#viewChangelog').click(()=>{
	showChangeLog();
});


/* 
This function is for moving from v0.82 -> v0.83
We were storing groups on the global sync object. We need to put them into a groups property
We also need to add properties for compactStyles and dismissedProfilesPrompt
*/

function fixStorage(groups){
	// create new object (essentially backing up the user's settings)
	let newObj = {
		"groups": groups || [],
		"dismissedProfilesPrompt": false,
		"compactStyles": false
	};

	// clear the cloud storage
	chrome.storage.sync.clear();

	// set the backup as storage (in our newer format)
	chrome.storage.sync.set(newObj, function(){});

	getUserData();
}


// GOOGLE ANALYTICS
// ga('send', 'event', [eventCategory], [eventAction])


function getVersion() {
  return chrome.app.getDetails().version;
}

// Check if the version has changed
if (getVersion() != localStorage.version) {
  localStorage.version = getVersion();
	// either way, show changelog modal
	showChangeLog();
}

// remove an item from an array (used for removing custom chrome from users' groups)
function arrayRemove(arr, value) {
	return arr.filter(function (item) {
		return item != value;
	});
}