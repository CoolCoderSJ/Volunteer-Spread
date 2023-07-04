const { Client, Account, ID, Databases, Query } = Appwrite;
const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('it-map');               // Your project ID
const databases = new Databases(client);

const getMethods = (obj) => {
    let properties = new Set()
    let currentObj = obj
    do {
      Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return [...properties.keys()].filter(item => typeof obj[item] === 'function')
  }

window.addEventListener('load', () => {
    let loadingPopup = Swal.fire({
        title: 'Loading...',
        showCancelButton: false
    })
    Swal.showLoading()

    L.Icon.Default.imagePath = 'images/';
    // Creating map options
    var mapOptions = {
       center: [35, 0],
       zoom: 2
    }
    var map = new L.map('map', mapOptions); // Creating a map object

    // Creating a Layer object
    var layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    map.addLayer(layer);         // Adding layer to the map


    databases.listDocuments('data', 'locations', [Query.limit(100)]).then((docs) => {
        let people = docs.documents;
        people.forEach(person => {
            let markerOptions = {
                title: person.name,
                clickable: true,
                draggable: false
            }
            let marker = L.marker(person.coordinates, markerOptions);
            marker.bindPopup(person.name).openPopup();
            marker.addTo(map);
            document.getElementById("table").innerHTML += `<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
            <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
               ${person.name}
            </th>
            <td class="px-6 py-4">
               ${person.address}
            </td>
            <td class="px-6 py-4">
            <button type="button" onclick="map.flyTo([${person.coordinates}], 10)" class="text-white bg-green-400 hover:bg-green-500 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">View</button>
            </td>
      </tr>`
        })
    }).then(() => {
      Swal.close()
    })
    window.map = map
    console.log(getMethods(window.map));
})

const validateSubmission = () => {
    Swal.fire({
        title: 'Click OK to find coordinates',
        inputAttributes: {
          autocapitalize: 'on'
        },
        showCancelButton: false,
        showLoaderOnConfirm: true,
        preConfirm: (login) => {
          return fetch(`https://api.geoapify.com/v1/geocode/search?text=${document.getElementById("address").value}&format=json&apiKey=1b48259b810e48ddb151889f9ea58db0`)
            .then(response => {
              if (!response.ok) {
                throw new Error(response.statusText)
              }
              return response.json()
            })
            .catch(error => {
              Swal.showValidationMessage(
                `Request failed: ${error}`
              )
            })
        },
        allowOutsideClick: () => false
      }).then((result) => {
        if (result.isConfirmed) {
            let geocodeResults = result.value.results;
            if (!geocodeResults.length > 0) {
                Swal.fire({
                    title: `No coordinates found, try again`,
                    icon: 'error'
                  })
            }
            else {
                let coordinates = [geocodeResults[0].lat, geocodeResults[0].lon]
                let formattedAddress = geocodeResults[0].formatted
                Swal.fire({
                    title: `Coordinates found!`,
                    showCancelButton: true,
                    text: `Coordinates: ${coordinates[0]}, ${coordinates[1]}\nAddress: ${formattedAddress}\nIf this looks incorrect, please click cancel and edit the address. Otherwise, click OK.`,
                  }).then(result => {
                    if (result.isConfirmed) {
                        databases.createDocument('data', 'locations', ID.unique(), {
                            name: document.getElementById("name").value,
                            address: formattedAddress,
                            coordinates: coordinates,
                        }).then(() => {
                            window.location.reload()
                        });
                    }
                  })
            }
        }
      })
};

window.validateSubmission = validateSubmission;