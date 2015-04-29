var extArray = [];
var activeExtensions = [];
var inactiveExtensions = [];

// Handlebars.js
var source   = $("#entry-template").html();
var template = Handlebars.compile(source);

$(document).ready(function(){
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

				// divide the extensions into two separate lists of active (enabled = true) and inactive (enabled = off) and output them into the appropriate HTML div
				if (entry.enabled) {
					$('#activeExtensions').append(template(entry));
				} else {
					$('#inactiveExtensions').append(template(entry));
				}
			});

			extStateListener(); // run the function which listens for a change in a checkbox state
			
			$(".extId").hide();
			$(".extState").hide();

			$(".extBlock").click(function(){
				var theExtId = $(this).find(".extId").text();
				var theExtState = $(this).find(".extState");
				var theExtStateText = theExtState.text();
				var wholeExt = $(this);
				if (theExtStateText === "true") {
					chrome.management.setEnabled(theExtId, false, function (){
						theExtState.text("false");
						wholeExt.append(".inactiveExtensions");
						location.reload();
					});
				} 
				else if (theExtStateText === "false") {
					chrome.management.setEnabled(theExtId, true, function (){
						theExtState.text("true");
						wholeExt.append(".activeExtensions");
						location.reload();
					});
				};
			});
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

// function which listens for checkbox changes and then disables/enables extension depending on the change requested
var g;
function extStateListener() {
	$('.extState').change(
		function(){
			g = $(this).parent(); // g is now set to the selected extension
			console.log(g);
			var appId = g.id; // set the appid as an attribute in our handlebars template at the end of popup.html ** changed g.attr('appid') to g.id - it should still work **
			if (g.enabled) {
				// app is active, disable extension - eh this is being mirrored for some reason, asynchronous-ness messing stuff up maybe? works anyway
				chrome.management.setEnabled(appId, true, function (){
					// SET SWITCH TO OFF? HERE
				});
			} else {
				// app is off, turn on - as above, this is being mirrored for some reason. working tho...
				chrome.management.setEnabled(appId, false, function (){
					// SET SWITCH TO ON? HERE
				});
			}
		}
	);
};



// Changes the appearance of a profile button to show if it's in on or off mode
$(".profile-btn").click(function(){
	if ($(this).hasClass("enabled")) {
		$(this).removeClass("enabled");
		$(this).addClass("disabled");
	}
	else if ($(this).hasClass("disabled")) {
		$(this).removeClass("disabled");
		$(this).addClass("enabled");
	};
});



	// extArray.forEach(function(a) {
	// 	if (a.id === "diebikgmpmeppiilkaijjbdgciafajmg") { 
	// 		console.log(a);}
	// 	});




// messing around trying to get the profile buttons working

alwaysOnBtn.addEventListener('click', function(){
if ($(this).hasClass("enabled")) {
	profile1args.forEach(function(arg) {
		chrome.management.setEnabled(arg, false, function (){
			console.log('Turning ' +arg+ ' off');
			extArray[63].enabled = false;
		});
	});
} else if ($(this).hasClass("disabled")) {}
	profile1args.forEach(function(arg) {
		chrome.management.setEnabled(arg, true, function (){
			console.log('Turning Reddit on');
			extArray[63].enabled = true;
		});
	});
	checkboxListener();
});

var profile1args = ["kbmfpngjjgdllneeigpgjifpgocmfgmb"];
var profile2args = [];

for (var i = 0, len = extArray.length; i < len; i++) {
	if (extArray[i].id === profile1args[0]) {
		console.log("Extension name: " + extArray[i].name);
	};
};



// extension.toggle(enabled);


// chrome.management.setEnabled("kbmfpngjjgdllneeigpgjifpgocmfgmb", false, function (){
//   console.log('Turning appid Reddit off');
// });
// extArray.forEach(function(extension){
// 	if (extension.id === "kbmfpngjjgdllneeigpgjifpgocmfgmb") {
// 		console.log(extension.name);
// 	}
// });


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

