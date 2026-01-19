/* =====================================================
   Use: Open page link
===================================================== */
function openLink(url) {
  window.open(url, "_blank");
}



/* =====================================================
   Use: Toggle Files Section
===================================================== */
function toggleFiles(){
  const section = document.getElementById("filesSection");
  section.style.display =
    section.style.display === "none" ? "block" : "none";
}

