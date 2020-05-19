friends=[
    "Ajinkya",
    "Neel ",
    "Aditya"
]

friends.forEach(function (friend,index) {
    document.getElementById("ListOfFriends").innerHTML +=`<li><h1>${friend}</h1></li>`
})