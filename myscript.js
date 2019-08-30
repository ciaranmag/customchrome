/****** DECLARING VARIABLES *****/
let extArray = [],
appArray = [],
activeExtensions = [],
inactiveExtensions = [],
idList = [],
user = {},
justIds = [],
currentJob,
groupName;

const customChromeId = 'balnpimdnhfiodmodckhkgneejophhhm';
/****** END DECLARING VARIABLES ******/


$('#compactStylesheet')[0].disabled = true;
// $('#darkMode')[0].disabled = true;
$('.modal-trigger').leanModal();

chrome.management.getAll(function(info) {
	// info is a list of all user installed apps i.e. extensions, apps, and themes
	// push extensions to extArray
	for (let i = 0; i < info.length; i++) {
		let entry = info[i];
		// console.log(entry);
		// Make an array of all the extension and app ids
		justIds.push(entry.id);
		switch(entry.type) {
			case "extension":
				extArray.push(entry);
				break;
			case "hosted_app":
				extArray.push(entry);
				entry.isApp = '<span class="new badge"></span>';
				break;
		}
	}

	// call function to check storage.sync for existing user groups
	getUserData();

	// sort extArray into alphabetical order based on the extensions' names
	extArray.sort(function(a, b) {
		return a.name.localeCompare(b.name);
	});
	
	// loop over extArray, sort icons, append to appropriate element
	for (let i = 0; i < extArray.length; i++) {
		let entry = extArray[i];
	
		// extension icons are stored in entry.icons, but not all extensions have icons
		if (entry.icons === undefined) {
			entry.pic = 'images/icon-128.png';  // if there aren't any icons, use our default icon
		}
		else if (entry.icons.length > 2) {
			entry.pic = entry.icons[entry.icons.length-2].url;
		}
		else {
			// if there is an array of icons, we want the highest res one (which is the last one in the array) so get the array length (-1) to get the last icon then set that item's url as our app icon url
			entry.pic = entry.icons[entry.icons.length-1].url;
		}

		entry.stringEnabled = entry.enabled ? "checked" : '';
		
		// Check if extension type is development
		entry.installType === "development" ? entry.development = true : false;
		// entry.installType === "sideload" ? entry.sideload = true : false;

		// divide the extensions into two separate lists of active (enabled = true) and inactive (enabled = off) and output them into the appropriate HTML div
		entry.enabled ? $('#activeExtensions').append(template(entry)) : $('#inactiveExtensions').append(template(entry));
	
	} // close extArray loop
	
	// hide on/off switch for Custom Chrome extension
	$('#balnpimdnhfiodmodckhkgneejophhhm label').hide();

	// turn on/off extensions when toggle is switched
	$('.state-switch').change(function () {
		$('#refresh-icon').show();
		// get the app id
		let id = $(this).parents('.switch').attr('id'),
		// get the app name
		name = $(this).parents('.switch').attr('name');
		// if ($(this).is(':checked')) {
		for (let i = 0; i < extArray.length; i++) {
			if (extArray[i].id === id && !extArray[i].enabled) {
				extArray[i].enabled = true;
				chrome.management.setEnabled(id, true, function () {
					Materialize.toast(`${name} is now on`, 2000, 'ccToastOn');
				});
			}
			else if (extArray[i].id === id && extArray[i].enabled) {
				extArray[i].enabled = false;
				chrome.management.setEnabled(id, false, function () {
					Materialize.toast(`${name} is now off`, 2000, 'ccToastOff');
				});
			}
		}
		handleGroupsClasses();
	});

	// initialise tooltips
	$('.tooltipped').tooltip();

}); // close chrome.management.getAll

$('#searchbox').focus();

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
		// if they are all on, add class "on" to element, otherwise leave it grey
		let tempArray = [];

		for (let i = user.groups[group].length-1; i >= 0; i--) {

			let id = user.groups[group][i];
			
			for (let x = 0; x < extArray.length; x++) {
				if (extArray[x].id === id) { tempArray.push(extArray[x]); }
			}
		}
		// tempArray now contains extension objects for this group
		// check if any of the extensions have enabled === false
		// if even one extension is off, then the group is inactive
		let off = tempArray.some(function(ext){
			return ext.enabled === false;
		}) || false;

		group = group.replace(/ /g, "_");
		// if it's on/off, add/remove appropriate classes
		if (!off) {
			$(`#${group}`).removeClass("off").addClass("on");
		}
		else if (off) {
			$(`#${group}`).removeClass("on").addClass("off");
		}
	}

	$('.group-holder').show();

	chrome.storage.sync.set(user);
}

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
		
		// groupname doesn't exist yet, proceed with selecting extensions for the new group
		$('#groupPrompt').closeModal();

		// after half a second open the modal, user can specify what extensions to add to group
		setTimeout(function(){
				addExtensions(name);
		}, 500);
	}
);

function checkboxListener() {
	// turn on/off extensions when toggle is switched
	$('.extList-toggle input').change(function () {
		//get the extension id the user clicked
		let id = $(this).attr('appid');
		if ($.inArray(id, idList) != -1) {
			let index = idList.indexOf(id);
			idList.splice(index, 1);
			return;
		}
		idList.push(id);
	});
}

// add extensions to new group modal
function addExtensions(name) { 
	$('#addExts').openModal({
		dismissible: true,
		ready: function() {
			checkboxListener();
		},
		complete: function () {
			$('#extList').html('');
			idList = [];
		}
	});

	$('#addExts h4').text(`Add extensions to ${name}`);
	
	$('#extList').html('');
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
			$('#extList').html('');
			Materialize.toast(`${name} group added`, 2000, 'ccToastOn');
			$('#addExts').closeModal(); //close the modal
			// $('#groupHeader').slideDown();
		}
	}
);

function submitThatShit() {
	// turn all selected extensions on -- DON'T DO THIS EDITING
	if (currentJob === 'creating') {
		idList.forEach(function(extensionId, index) {
			chrome.management.setEnabled(extensionId, true);
		});
	}

	// set new group on user obj, with idlist as array
	user.groups[name] = idList;

	chrome.storage.sync.set(user, function () {});

	// Track event in Google
	// ga('send', 'event', "groups", "group-added");

	setTimeout(function () {
		// adding false lets the page reload from the cache
		location.reload(false);
	}, 500);

}

// check storage for user data
function getUserData() {
	chrome.storage.sync.get(function(obj){
		// There should be a "groups" property, assume that if it doesn't exist, then they're on the old version
		if (!obj.hasOwnProperty('groups')) {
			// console.log('migrating user data...');
			fixStorage(obj);
			return;
		}

		// at this point, we're on the new data structure, set global user obj
		user = obj;
		// console.log("user:", user);

		// check if user has compact styles checked
		if (user.compactStyles) {
			// toggle switch to on state
			$('.compact-styles-switch').attr('checked', true);
			// enable compact styles stylesheet
			$('#compactStylesheet')[0].disabled = false;
		}

		// hide apps if user has toggled that option
		if (!user.includeApps) {
			// hide apps
			$('.app').hide();
			$('#searchbox').attr('placeholder','search extensions');
		}
		else {
			// set toggle switch to checked
			$('#include-apps-switch').attr('checked', true);
			$('#searchbox').attr('placeholder','search extensions and apps');
		}
		
		getExtensionCount();

		// Check if there's a toast to show
		if (user.showToast && user.showToast.length) {
			// show toast
			Materialize.toast(user.showToast, 2000, 'deleteToast');
			user.showToast = "";
			chrome.storage.sync.set(user);
		}

		let allGroups = Object.keys(user.groups);
		// if user has groups, show groups
		if (allGroups.length > 0) {
			// show groups
			$('#groupHeader, .editBtn').show();
			$('#noGroupsText, #groupOnboarding').hide();

			// clear out html in group-holder
			$('.group-holder').html('');

			// append groups to the div
			for (let i = 0; i < allGroups.length; i++) {
				let name = allGroups[i];

				for (let x = 0; x < user.groups[name].length; x++) {
					// check if each extension is still installed by the user
					let id = user.groups[name][0];
					if (justIds.indexOf(id) == -1) {
						user.groups[name].splice(user.groups[name].indexOf(id), 1);
						continue;
					}
				}

				let extCount = user.groups[name].length;

				let extNames = [];
				for (let k = 0; k < user.groups[name].length; k++) {
					let id = user.groups[name][k];
					for (let x = 0; x < extArray.length; x++) {
						if (extArray[x].id === id) {
							extNames.push(extArray[x].shortName);
						}
					}
				}

				let btnHtml = `<button class='group-btn tooltipped off' id='${name.toLowerCase().split(' ').join('_')}' data-tooltip='${extNames.join('\n')}'>${name} (${extCount})</button>`;
				
				// append to group-holder
				$('.group-holder').append(btnHtml); 
			}

			// delete any empty groups
			Object.keys(user.groups).forEach(function (group) {
				if (user.groups[group].length === 0) {
					$(`#${group.toLowerCase().split(' ').join('_')}`).remove();
					delete user.groups[group];
				}
			});

			removeCC();
			handleGroupsClasses();
			addGroupLabels(user.groups);
		}
		// if user has dismissed group prompt, hide group header
		else if (user.dismissedProfilesPrompt) {
			// User has no groups, and has dismissed groups prompt
			$('#groupHeader, #groupOnboarding, .editBtn').hide();
		}
		else {
			// show user the group prompt and hide the edit groups button
			$('.group-holder, #groupOnboarding').show();
			$('#noGroupsText').text("You don't have any groups setup.");
			$('.editBtn').hide();
		}
	});
}

function addGroupLabels(groups){
	// loop over all groups
	for (let group in groups) {
	  if (Object.prototype.hasOwnProperty.call(groups, group)) {
	    // for each id in the group, find the switch with that ID
	    // then find its parent entry, then its child groupLabel
	    // append the name to that element
	    groups[group].forEach(function (id) {
	      let target = $(`#${id}`).parents('.extBlock').find('.extName');
	      let spanHtml = `<span class='groupLabel tooltipped' data-tooltip="${group}">${group.substring(0, 1).toUpperCase()}</span>`;
	      target.append(spanHtml);
	    });
	  }
	}
	$('.tooltipped').tooltip();
}

function confirmDelete(group){
	$('#confirmDelete').openModal({});
	$('#confirmDelete h5').html(`Are you sure you want to delete the group ${group}?`);
	
	//on confirm - delete group from storage, show toast confirming group delete
	//on cancel - close the modal and do nothing
	$("body").on("click", "#deleteGroup", function () {
		delete user.groups[group];

		// add property to user object that will show "group deleted" toast when extension reloads
		user.showToast = `${group} successfully deleted`;
		chrome.storage.sync.set(user);

		Materialize.toast(`Deleting ${group}`, 2000, 'deleteToast');
		setTimeout(function () {
			location.reload(false);
		}, 1000);
	});
}

$("#editExtSubmit").submit(function(e){
	e.preventDefault();

	//if no extensions are selected, show toast warning and return
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
		/***** CHECK IF THE GROUP LIST AND ID LIST ARE THE SAME IF SO THEN NOTHING WAS EDITED ******/
		user.groups[groupName] = idList;
		chrome.storage.sync.set(user, function(){
			Materialize.toast(`${newName} group successfully edited`, 1000, 'ccToastOn');
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
		if ($.inArray(newName, Object.keys(user.groups)) != -1){
			Materialize.toast('Group name already exists!', 2000, 'alert');
		}
		else {
			//new name is ok, delete old name from storage
			delete user.groups[groupName];
			user.groups[newName] = idList;
			chrome.storage.sync.set(user, function(){
				Materialize.toast(`${newName} group successfully edited`, 1000, 'ccToastOn');
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
	}

	// Track event in Google
	// ga('send', 'event', "groups", "group-edited");

});

// GOOGLE ANALYTICS
// ga('send', 'event', [eventCategory], [eventAction])


/****** TEMPLATE FUNCTIONS ******/

function template(entry) {
	return `
	<div class="extBlock${entry.isApp ? ' app' : ''}">
	<div class="lefty">
	 	<div class="picHolder">
	 		<img src="${entry.pic}">
	 	</div>
	 	<div class="nameDesc">
		 	<span class="extName">${entry.name}</span>
      ${entry.development ? '<span class="development-badge tooltipped" data-tooltip="Development">D</span>' : ''}
      <!--${entry.sideload ? '<span class="development-badge tooltipped" data-tooltip="Sideload">S</span>' : ''}-->
    	${entry.isApp ? '<span class="new badge"></span>' : ''}
      <br>
		 	${!user.compactStyles ? `<span class="extDescription">${entry.description}</span>`: ''}
		</div>
	</div>

	<div class="righty">
    <div class="switch ext-switch" id="${entry.id}" name="${entry.name}">
	    <label>
	      <input type="checkbox" ${entry.stringEnabled} class="js-switch state-switch" tabindex="1">
	      <span class="lever"></span>
	    </label>
	    <a class='btn-flat show-ext-links togdrop' href='#'><i class="material-icons">arrow_drop_down</i></a>
	    <a class='btn-flat hide-ext-links' href='#'><i class="material-icons">arrow_drop_up</i></a>
	  </div>
	</div>

	<div class="container ext-links">
			<div class="row description">
				<span>${entry.description}</span>
			</div>
	    <div class="row buttons" data-extId="${entry.id}">
        ${entry.homepageUrl ? `<div class="link"><a href="${entry.homepageUrl}" target="_blank"><i class="material-icons">home</i>Homepage</a></div>` : ''}
				<!--${entry.optionsUrl ? `<div class="link"><a href="${entry.optionsUrl}"><i class="material-icons">settings</i>Options</a></div>` : ''}-->
        <div class="link"><a href="#!" class="uninstallExt"><i class="material-icons">delete</i>Uninstall</a></div>
	    </div>
	</div>
</div>`;
}

function extListTemplate(ext) {
	return `
	<div class='extList-holder'>
		<div class='extList-toggle'>
			<input type="checkbox"  id="${ext.name}" appid=${ext.id}>
			<label for="${ext.name}"></label>
		</div>
		<div class='extList-img'>
			<img src='${ext.pic}'>
		</div>
		<div class='extList-name'>
			<span>${ext.name}</span>
		</div>
	</div>`;
}

function groupListTemplate(group) {
	return `
	<div class='groupList-holder' group="${group}">
		<div class='groupList-name'>
			<span>${group}</span>
		</div>
		<button class="btn waves-effect waves-light grey edit">EDIT</button>
		<button class="btn waves-effect waves-light red delete">DELETE</button>
	</div>`;
}

function popupMessage(message, btnText) {
	return `
	<div id="popupMessage" class="modal">
		<div class="modal-content">
			<p>${message}</p>
		</div>
		<div class="modal-footer">
			<a href="#!" class="modal-action modal-close waves-effect waves-green btn-flat">${btnText}</a>
		</div>
	</div>`;
}

/****** END TEMPLATE FUNCTIONS ******/


/****** LISTENERS ******/

$(function () { // load all listeners when the DOM is ready
// When the search input is in focus change the colour of the search icon
$('#searchbox').focus(function () {
	$('#search-icon').css('color', '#26a69a');
});
$('#searchbox').focusout(function () {
	$('#search-icon').css('color', '#9f9f9f');
});

$('#refresh-icon').on('click', function (e) {
	location.reload(false);
});

// Search
$("#searchbox").keyup(function () {
	// Retrieve the input field text
	let searchTerm = $(this).val();
	// Loop through the extensions, toFilter array will hold all elements to search through
	// fill this depending on whether apps are on or off
	let toFilter = user.includeApps ? $(".extBlock") : $(".extBlock:not(.app)");

	toFilter.each(function (i, el) {
		$(el).find('.extName').text().search(new RegExp(searchTerm, "i")) < 0 ? $(el).fadeOut() : $(el).fadeIn();
	});

	// if the search returns no results then show the no results card
	setTimeout(function () {
		if ($(".extName:visible").length === 0) {
			$("#noResults").fadeIn();
			$('#activeExtensions, #inactiveExtensions').parent().css('visibility', 'hidden');
			$('.allExtensionsContainer').css({'visibility': 'hidden','height': '0px'});
			// fill in text
			$('#noResults .filterLink .search-failed-text').text(searchTerm);
			// update url
			$('#noResults a.filterLink').attr("href", `https://chrome.google.com/webstore/search/${encodeURIComponent(searchTerm)}`);
		} else {
			$("#noResults").hide();
			$('.allExtensionsContainer').css({'visibility': 'visible','height': 'auto'});
			$('#activeExtensions, #inactiveExtensions').parent().css('visibility', 'visible');
		}
	}, 500);
});

// after clicking a group's on/off button, we toggle its appearance (on or off) and cycle through associated extensions turning them all on or off
$("body").on("click", ".group-btn", function () {
	let btn = $(this);

	// find out which extension was clicked and assign to btnId
	let groupClicked = btn.attr("id").replace(/_/g, " ");

	// check if group was on or off
	if (btn.hasClass("on")) {
		// It was on, turn all extensions off
		// Loop over each extension in the group
		user.groups[groupClicked].forEach(function (extensionId) {

			// Check to see if this extension lives in any of the groups that are still on
			let keepOn = false;

			// Get all group names that are on (have .on class)
			let activeGroups = [];
			for (let i = $('.group-btn.on').length - 1; i >= 0; i--) {
				let groupName = $($('.group-btn.on')[i]).attr('id').replace(/_/g, " ");

				// ignore the groupClicked group
				groupName != groupClicked ? activeGroups.push(groupName) : false;
			}

			// for each group in activeGroups array
			// search the ids in its group
			// if we get a match, then keepOn = true
			for (let i = activeGroups.length - 1; i >= 0; i--) {
				keepOn = user.groups[activeGroups[i]].some(function (extId) {
					return extId === extensionId;
				});
			}

			// this extension mustn't be in any other active group
			// turn it off
			!keepOn ? chrome.management.setEnabled(extensionId, false) : 0;

		});

		Materialize.toast(`${groupClicked} is now off`, 2000, 'ccToastOff');

		// change group btn to "off" appearance
		$(this).removeClass("on").addClass("off");
		setTimeout(function () {
			// adding false lets the page reload from the cache
			location.reload(false);
		}, 500);
	}
	else if (btn.hasClass("off")) {
		// if the btn is currently off then turn all extensions on
		user.groups[groupClicked].forEach(function (extensionId) {
			// console.log('enabling extension:', extensionId);
			chrome.management.setEnabled(extensionId, true);
		});

		Materialize.toast(`${groupClicked} is now on`, 2000, 'ccToastOn');

		// change group btn to "on" appearance
		$(this).removeClass("off").addClass("on");
		setTimeout(function () {
			// adding false lets the page reload from the cache
			location.reload(false);
		}, 500);
	}

	// track that the user has toggled a group
	// ga('send', 'event', "groups", "group-toggled");

});

// listen for addGroup button press, add a button to HTML, prompt for group name, set that name as button text, add that group to the storage.sync object
$('.addGroup').click(function () {
	currentJob = 'creating';
	$('#groupPrompt').openModal({
		ready: function () {
			$('#name').focus();
		},
		complete: function () {
			$('#name').val('');
		}
	});
});

$("body").on("click", ".editBtn", function () {
	currentJob = 'editing';
	$('#editGroups').openModal({});

	$('#groupList').html('');
	for (let i = 0; i < Object.keys(user.groups).length; i++) {
		$('#groupList').append(groupListTemplate(Object.keys(user.groups)[i]));
	}
});

$('#removeAllBtn').click((e) => {
	e.preventDefault();
	$('#confirmDeleteAll').openModal();
});

$("body").on("click", "#deleteAllGroups", function () {
	// User confirms delete all groups, remove all groups (set empty object)
	user.groups = {};

	// save in memory
	chrome.storage.sync.set(user);

	Materialize.toast('Deleting your groups...', 2000, 'deleteToast');
	setTimeout(function () {
		location.reload(false); // adding false lets the page reload from the cache
	}, 1000);
});

$("body").on("click", ".delete", function () {
	//when a group delete button is clicked, get the name of the group being deleted
	let group = $(this).parent().attr('group');

	//close the current modal, and clear out the groupsList
	$('#editGroups').closeModal();
	$('#groupList').html('');

	//wait half a second, open a new confirm/cancel modal
	setTimeout(function () {
		confirmDelete(group);
	}, 500);
});

$("body").on("click", ".edit", function () {
	groupName = $(this).parent().attr('group');
	// console.log('user is editing: ', groupName);

	//close the current modal, and clear out the groupsList
	$('#editGroups').closeModal();
	$('#groupList').html('');

	//prefill the group name input with the current group name
	$('#editGroupName').val(groupName);

	$('#editExtList').html('');
	//populate list with all extensions:
	for (let i = 0; i < extArray.length; i++) {
		if (extArray[i].id === 'balnpimdnhfiodmodckhkgneejophhhm') {
			continue;
		}
		let ext = extArray[i];
		$('#editExtList').append(extListTemplate(ext));
	}

	// Loop over all id's in group, check the boxes that are already in the group, also raise the checked extensions to the top of the list, do this loop starting at the end (i--) so that it's done alphabetically
	for (let i = user.groups[groupName].length-1; i >= 0; i--) {
		let id = user.groups[groupName][i];
		idList.push(id);
		//find input with this id and add .prop('checked', true);
		$(`#editExtList input[appid="${id}"]`).prop('checked', true);
		$("#editExtList").prepend($(`[appid=${id}]`)[0].parentElement.parentElement);
	}

	//start listening for checkbox changes
	checkboxListener();

	//wait half a second, open a new confirm/cancel modal
	setTimeout(function () {
		$('#editExts').openModal({
			complete: function () {
				$('#editExtList').html('');
			}
		});
	}, 500);
});

$("body").on("click", ".uninstallExt", function (e) {
	e.preventDefault();

	// User wants to uninstall an extension, get extension ID
	let id = $(e.currentTarget).parents('.row.buttons').attr('data-extid');

	// uninstall - native confirm dialog is mandatory therefore CC will start again where it will remove the extension from any groups it was in
	chrome.management.uninstall(id, {}, () => {
		chrome.storage.sync.set(user);
	});
	// custom chrome closes automatically
});


$("body").on("click", ".show-ext-links", function (e) {
	e.preventDefault();
	// User wants to show the extension links, get refrence to relevant ext-links element
	$(this).parents('.righty').siblings('.ext-links').slideDown();

	// hide down arrow, show up arrow
	$(e.currentTarget).hide();
	$(e.currentTarget).siblings('.hide-ext-links').show();
});

$("body").on("click", ".hide-ext-links", function (e) {
	e.preventDefault();
	// User wants to hide the extension links, get refrence to relevant ext-links element
	$(this).parents('.righty').siblings('.ext-links').slideUp();

	// hide down arrow, show up arrow
	$(e.currentTarget).hide();
	$(e.currentTarget).siblings('.show-ext-links').show();
});

$("body").on("click", "#dismissGroupPrompt", function (e) {
	e.preventDefault();
	// User wants to dismiss the groups onboarding, hide call to actions, copy and buttons
	$('#groupHeader').hide();

	$('#popup').append(popupMessage('You can still add a group from the options panel (click gear icon in top right)', 'Ok!'));
	$('#popupMessage').openModal({
		complete: function () {
			$('#popup').html('');
		}
	});

	user.dismissedProfilesPrompt = true;
	chrome.storage.sync.set(user);
});

// turn on/off compact styles
$('.compact-styles-switch').change(function () {
	// get reference to stylesheet
	let sheet = $('#compactStylesheet')[0];

	// Toggle disabled attribute
	sheet.disabled = !sheet.disabled;

	// save current state to storage
	user.compactStyles = !sheet.disabled;
	chrome.storage.sync.set(user);

	// Track event in Google
	// ga('send', 'event', "options", `compact-styles-toggled-to-${user.compactStyles}`);

});

// turn on/off show apps
$('#include-apps-switch').change(function (e) {
	// console.log('toggling apps: ', e);

	if (e.target.checked) {
		// user wishes to include apps
		$('.app').show();
		Materialize.toast('Apps now showing', 2000, 'ccToastOn');
		$('#searchbox').attr('placeholder', 'search extensions and apps');
	}
	else {
		// user wishes to hide all apps
		$('.app').hide();
		Materialize.toast('Apps will not be shown', 2000, 'ccToastOff');
		$('#searchbox').attr('placeholder', 'search extensions');
	}

	getExtensionCount();
	user.includeApps = e.target.checked;
	chrome.storage.sync.set(user);

	// Track event in Google
	// ga('send', 'event', "options", `include-apps-toggled-to-${user.includeApps}`);
});

}); // End DOM ready
/****** END LISTENERS ******/


/****** VERSION MANAGEMENT ******/
/* 
This function is for moving from v0.82 -> v0.83
We were storing groups on the global sync object. We need to put them into a groups property
We also need to add properties for compactStyles and dismissedProfilesPrompt
*/

function fixStorage(groups) {
	// create new object (essentially backing up the user's settings)
	let newObj = {
		"groups": groups || [],
		"dismissedProfilesPrompt": false,
		"compactStyles": false
	};

	// clear the cloud storage
	chrome.storage.sync.clear();
	// set the backup as storage (in our newer format)
	chrome.storage.sync.set(newObj);

	getUserData();
}

let currentVersion = chrome.app.getDetails().version;
// Check if the version has changed
if (currentVersion != localStorage.version) {
  localStorage.version = currentVersion;
	showChangeLog();
}

function showChangeLog() {
	let changelogHTML = '';
	for (let [key, value] of Object.entries(changelog)) {
		changelogHTML += `<h6>${key}</h6><ul>`;
		value.forEach(function (item) {
			changelogHTML += `<li>${item}</li>`;
		});
		changelogHTML += '</ul>';
	}
	$('#changelogModal .modal-content')[0].innerHTML += changelogHTML;
	$('#changelogModal').openModal();
}

$('#viewChangelog').click(() => {
	showChangeLog();
});

// remove Custom Chrome from user's existing groups to prevent them from unintentionally turning off the extension
function removeCC() {
	Object.keys(user.groups).forEach(function (key) {
		user.groups[key] = arrayRemove(user.groups[key], 'balnpimdnhfiodmodckhkgneejophhhm');
		user.groups[key] == '' ? delete user.groups[key] : 0;
		chrome.storage.sync.set(user);
	});
}

// remove an item from an array (used for removing custom chrome from users' groups)
function arrayRemove(arr, value) {
	return arr.filter(function (item) {
		return item != value;
	});
}

/****** END VERSION MANAGEMENT ******/
