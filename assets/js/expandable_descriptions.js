$(document).ready(function () {

  var totalDescriptions = 5;
  var researchDescriptionOpen = [false, false, false, false, false];

  // project title event listener (PTEL)
  function generatePTEL(j) {
    return function (event) {
      if (researchDescriptionOpen[j]) {
        researchDescriptionOpen[j] = false;
        $('#researchDescription' + j).hide(500);
        $(this).find($('.fa')).removeClass('fa-minus-square').addClass('fa-plus-square');
      } else {
        researchDescriptionOpen[j] = true;
        $('#researchDescription' + j).show(500);
        $(this).find($('.fa')).removeClass('fa-plus-square').addClass('fa-minus-square');
      }
    };
  }

  for (i = 1; i <= totalDescriptions; i++) {
    $('#projectTitle' + i).on('click', generatePTEL(i));
  }
});
