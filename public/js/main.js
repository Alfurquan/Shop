$(document).ready(function() {
  $(".alert")
    .fadeTo(2000, 500)
    .slideUp(500, function() {
      $(".alert").slideUp(500);
    });
  $(".dropdown__heading").click(function() {
    $("#sort-menu").slideToggle();
  });
});
