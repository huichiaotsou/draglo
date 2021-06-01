function backToDashboard() {
  location.assign('/dashboard.html')
}

// Maps API
function initMap(spots, path) {
  restoreSearchBox()
  let map = new google.maps.Map(document.getElementById("map"), {
    center: { 
      lat: 23.9036873, 
      lng: 121.0793705 },
    zoom: 2,
    mapTypeControl: false,
    fullscreenControl: false,
  });

  if (spots) {
    let center = [0,0] //get the centeroid of all spots
    spots.map(spot => {
      center[0] += spot[0]
      center[1] += spot[1]
    })
    map = new google.maps.Map(document.getElementById("map"), {
      center: { 
        lat: (center[0] /spots.length), 
        lng: (center[1] /spots.length)},
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    spots.map(s => {
      let myLatLng = { lat: s[0] , lng: s[1] };
      const marker = new google.maps.Marker({
        position: myLatLng,
        map,
      });
      const infowindow = new google.maps.InfoWindow({
        content: s[2],
      });
      marker.addListener("mouseover", () => {
        infowindow.open(map, marker);
      })
      marker.addListener("mouseout", () => {
        infowindow.close();
      })

    })
  }

  if (path) {
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: path.center, 
      mapTypeControl: false,
      fullscreenControl: false,  
    });

    path.spots.map(s => {
      let myLatLng = { lat: s[0] , lng: s[1] };
      const marker = new google.maps.Marker({
        position: myLatLng,
        map,
      });
      const infowindow = new google.maps.InfoWindow({
        content: s[2],
      });
      marker.addListener("mouseover", () => {
        infowindow.open(map, marker);
      })
      marker.addListener("mouseout", () => {
        infowindow.close();
      })

    })

    const drawPath = new google.maps.Polyline({
      path: path.coordinates,
      geodesic: true,
      strokeColor: "#EA4336",
      strokeOpacity: 1,
      strokeWeight: 2,
    });
    drawPath.setMap(map);
  }

  const input = document.getElementById("pac-input");
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo("bounds", map);
  // Specify just the place data fields that you need.
  autocomplete.setFields(["place_id", "geometry", "name", "formatted_address"]);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  const infowindow = new google.maps.InfoWindow();
  const infowindowContent = document.getElementById("infowindow-content");
  infowindow.setContent(infowindowContent);
  const geocoder = new google.maps.Geocoder();
  autocomplete.addListener("place_changed", () => {
    infowindow.close();
    const place = autocomplete.getPlace();
    const marker = new google.maps.Marker({ 
      map: map,
      animation: google.maps.Animation.DROP,
      icon: {
        path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
        fillColor: "#EA4336",
        fillOpacity: 0.7,
        strokeWeight: 1,
        scale: 2,
        anchor: new google.maps.Point(12, 10),
      }
    });
    
    marker.addListener("click", () => {
      popUpAddSpot(place.name, place.place_id);
    });

    if (!place.place_id) {
      return;
    }
    geocoder.geocode({ placeId: place.place_id }, (results, status) => {
      if (status !== "OK" && results) {
        window.alert("Search failed due to: " + status);
        return;
      }
      map.setZoom(15);
      map.setCenter(results[0].geometry.location);
      // Set the position of the marker using the place ID and location.
      marker.setPlace({
        placeId: place.place_id,
        location: results[0].geometry.location,
      });
      marker.setVisible(true);
      infowindowContent.children["place-name"].textContent = place.name;
      infowindowContent.children["place-address"].textContent = results[0].formatted_address
      infowindow.open(map, marker);
      infowindow.addListener("click", () => {
        popUpAddSpot(place.name, place.place_id);
      });
      
    });
  });

  map.addListener('click', (e)=>{
    const request = {
      placeId: e.placeId,
      fields: ["name", "place_id", "geometry"],
    };

    const service = new google.maps.places.PlacesService(map);
    service.getDetails(request, (place, status) => {
      const marker = new google.maps.Marker({
        position: place.geometry.location,
        map,
        animation: google.maps.Animation.DROP,
        icon: {
          path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
          fillColor: "#EA4336",
          fillOpacity: 0.7,
          strokeWeight: 1,
          scale: 2,
          anchor: new google.maps.Point(12, 10),
        }
      });
      marker.setVisible(true);
      marker.addListener("click", () => {
        popUpAddSpot(place.name, place.place_id);
      });
    });
  })
  
}

let socket = io({
  auth: {
      token: accessToken
  }
});          

function restoreSearchBox() {
  const container = document.getElementById('google_maps_container');
  container.innerHTML = `
    <div style="display: none">
      <input id="pac-input" class="controls" type="text" placeholder="搜尋景點">
    </div>
    <div id="map"></div>
    <div id="infowindow-content">
      <span id="place-name" class="title"></span><br>
      <span id="place-address"></span>
    </div>`
}

//init pending arrangements list
window.addEventListener('storage', ()=>{
  getPendingArrangements(null, JSON.parse(localStorage.getItem('trip_settings')).id);
  console.log("1");
})

//reload pending arrangements upon dragging in & out
// document.getElementById('calendar-container').addEventListener('mouseup', ()=>{
//   setTimeout(()=>{
//     getPendingArrangements(null, JSON.parse(localStorage.getItem('trip_settings')).id);
//   }, 200)
//   console.log("2");

// })
// document.getElementById('calendar-container').addEventListener('mouseout', ()=>{
//   setTimeout(()=>{
//     getPendingArrangements(null, JSON.parse(localStorage.getItem('trip_settings')).id);
//   }, 200)
//   console.log("3");

// })

function popUpAddSpot(spotName, placeId) {
  Swal.fire({
    position: 'center-end',
    title: '是否新增景點：<br>"' + spotName +'"',
    showCancelButton: true,
    confirmButtonText: 'OK',
    confirmButtonColor: '#3085d6'
  }).then((result) => {
    if (result.isConfirmed) {
      saveSpotInfo(spotName, placeId);
    } 
  })
}

function saveSpotInfo(spotName, placeId) {
  let data = {
    spotName,
    placeId,
    tripId: JSON.parse(localStorage.getItem('trip_settings')).id
  }
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/spot');
  xhr.onreadystatechange = function () {
    if(xhr.readyState == 4) {
      if(xhr.status == 200) {
        getPendingArrangements(null, data.tripId)
        console.log("4");
        socket.emit('refreshSpots', data.tripId)

      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: '景點新增失敗，請再試一次或聯絡網站管理員',
        }) 
      }
    }
  }
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
  xhr.send(JSON.stringify(data));
}


function getPendingArrangements(city, tripId) {
  let xhr = new XMLHttpRequest();
  if (city) {
    xhr.open('GET', `/arrangement?status=pending&id=${tripId}&city=${city}`);
  } else {
    xhr.open('GET', `/arrangement?status=pending&id=${tripId}`);
  }
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        let response = JSON.parse(xhr.responseText);
        let { cities, spots } = response;
    
        //append spots
        let spotsContainer = document.getElementById('external-events');
        spotsContainer.innerHTML = '';
        if (spots) {
          spots.map( s =>{
            let spot = document.createElement('div');
            spot.className = 'fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event';
            spot.setAttribute('id', s.google_id);
            spot.setAttribute('ondblclick', `removeEvent('${s.spot_id}', '${tripId}')`);
            spot.setAttribute('onclick', `renderSpots(null, '${s.google_id}')`);
            spot.dataset.spotId = s.spot_id;
            spotsContainer.appendChild(spot);
            let spotDetails = document.createElement('div');
            let city = s.city.split(' ');
            spotDetails.className = `fc-event-main spot-details ${city[0]}`;
            spotDetails.innerHTML = `${s.name}`;
            spotDetails.dataset.place_id = s.google_id;
            spotDetails.dataset.latitude = s.latitude;
            spotDetails.dataset.longtitude = s.longtitude;
            spot.appendChild(spotDetails); 
          })
        }
        //append cities
        let citiesContainer = document.getElementById('cities-container');
        citiesContainer.innerHTML = '';
        if (cities) {
          let showAll = document.createElement('div');
          showAll.className = 'city';
          showAll.innerHTML = '顯示全部城市清單';
          showAll.setAttribute('onclick', `
          getPendingArrangements(${null}, ${tripId});
          switchAutomationCity('null');`);
          citiesContainer.appendChild(showAll)
          cities.map(cityName => {
            let city = document.createElement('div');
            city.className = 'city';
            city.innerHTML = cityName;
            city.setAttribute('onclick', `
            getPendingArrangements('${cityName}', ${tripId}); 
            renderSpots('${cityName.split(' ')[0]}');
            switchAutomationCity('${cityName.split(' ')[0]}');`);
            citiesContainer.appendChild(city)
          })
        }        
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: '景點重整失敗，請再試一次或聯絡網站管理員',
        }) 
      }
    }
  }
  xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
  xhr.send();
}

function renderSpots(cityName, placeId) {
  let spots = [];
  if (cityName) {
    let cities = document.getElementsByClassName(cityName);
    for(let i = 0; i < cities.length; i++) {
      spots.push([parseFloat(cities[i].dataset.latitude), parseFloat(cities[i].dataset.longtitude), cities[i].innerHTML]);
    }
  }
  if (placeId){
    let spot = document.getElementById(placeId).childNodes[0]
    spots.push([parseFloat(spot.dataset.latitude), parseFloat(spot.dataset.longtitude), spot.innerHTML])
  }
  initMap(spots);
}

function renderDayPath(path) {
  console.log('path');
  console.log(path);
  // let spots = [];
  // spots.push([spot.latitude, spot.longtitude, spot.title])
  initMap(null, path);
}

function removeEvent(spotId, tripId) {
  Swal.fire({
    position: 'top-end',
    title: '確認刪除景點',
    text: "刪除後您將必須重新搜尋並加回清單",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'OK'
  }).then((result) => {
    if (result.isConfirmed) {
      //set is_arranged to -1 and reload spot list
      let data = {
        spotId,
        tripId
      }
      let xhr = new XMLHttpRequest();
      xhr.open('DELETE', '/arrangement');
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // getPendingArrangements(null, tripId);
            socket.emit('refreshSpots', tripId)
            console.log("5");

        }
      }
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.send(JSON.stringify(data));      

    }
  })
}


