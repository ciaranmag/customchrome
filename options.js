var allExtArray = [];


// Handlebars.js
var source2   = $("#modalExtList").html();
var template = Handlebars.compile(source2);


$(document).ready(function(){
	chrome.management.getAll(function(info) {
		// info is a list of all user installed apps, extensions etc push extensions to extArray
		info.forEach(function(entry) {
			if(entry.type === "extension"){
				allExtArray.push(entry);
			}
		})

		// Sort allExtArray in alphabetical order based on the extension's name
		allExtArray.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});

		// Spit out long list of all extension names into a modal after clicking the floating add btn
			allExtArray.forEach(function(entry) {
				// extension icons are stored in entry.icons, but not all extensions have icons
				if (entry.icons === undefined) {
					imgsrc = 'icon-128.png'  // if there aren't any icons, set a default
				} else {
					// and if there is an array of icons, we want the highest res one (which is going to be the last one in the array) so find the array length, then use that value (-1) to get the last icon then set that item's url as our app icon url
					imgsrc = entry.icons[entry.icons.length-1].url;
				}
				entry.pic = imgsrc; // setting the url we got earlier as entry.pic
					

				$('.modalOutput').append(template(entry));
			});
	});



});

$('.mdi-content-add').click(function(){
	$('#modal1').openModal();
})



// // SAMPLE OPTIONS FROM CHROME WEBSITE

// // Saves options to chrome.storage.sync.
// function save_options() {
//   var color = document.getElementById('color').value;
//   var likesColor = document.getElementById('like').checked;
//   chrome.storage.sync.set({
//     favoriteColor: color,
//     likesColor: likesColor
//   }, function() {
//     // Update status to let user know options were saved.
//     var status = document.getElementById('status');
//     status.textContent = 'Options saved.';
//     setTimeout(function() {
//       status.textContent = '';
//     }, 750);
//   });
// }

// // Restores select box and checkbox state using the preferences
// // stored in chrome.storage.
// function restore_options() {
//   // Use default value color = 'red' and likesColor = true.
//   chrome.storage.sync.get({
//     favoriteColor: 'red',
//     likesColor: true
//   }, function(items) {
//     document.getElementById('color').value = items.favoriteColor;
//     document.getElementById('like').checked = items.likesColor;
//   });
// }
// document.addEventListener('DOMContentLoaded', restore_options);
// document.getElementById('save').addEventListener('click',
//     save_options);