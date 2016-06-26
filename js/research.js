$(document).ready(function () {

    var molecularImagingText
        = '<div class="row"> \
               <div class="col-lg-4 text-left"> \
                   <p>Etiam sed quam elementum, ullamcorper urna a, lobortis massa. Quisque vel nulla in magna elementum egestas vitae a. la neque nisl, pellentesque sed augue nec, pellentesque efficitur orci. Quisque ornare imperdiet tempus. Fusce suscipit faucibus nunc. Aliquam nec bibendum nisi. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Ut convallis a nisl nec viverra. Nam scelerisque at nibh et efficitur.</p> \
                   <p>Cras commodo sem sed tellus commodo facilisis. Cras sed suscipit sapien. Etiam quis aliquet ex, at mollis lacus. Proin neque ipsum, placerat quis ultrices a, rhoncus a quam. Nulla dui velit, malesuada at metus malesuada, sagittis tincidunt dui. Vivamus at faucibus erat. Nullam nec purus quis nunc facilisis vulputate eget sed sapien. Maecenas lorem justo, hendrerit in arcu at, placerat porta felis. In vitae lacus efficitur, gravida elit quis, fringilla ex.</p> \
               </div> \
               <div class="col-lg-8 text-left"> \
                   <img src="img/yakitori.jpg" class="img-responsive" alt="Placeholder yakitori"> \
                   <img src="img/peach-sundae.jpg" class="img-responsive" alt="Placeholder sundae"> \
               </div> \
           </div>';
    
    var polyyneSynthesisText
        = 'Capture and trap organic solvent and shoot lasers at it!</p>';

    $('#researchBoxMolecularImaging').on('click', function () {
        $('#research-description-insertable').remove();
        
        $('<div/>',{'id':'research-description-insertable'}).html(
            $('<p>').html(molecularImagingText).append(
                $('<button type="button" class="btn btn-default">').html('Back').click(function() {
                    $('#research-description-insertable').remove();
                }))
        ).appendTo('#research-description')
    });
 
    $('#researchBoxPolyyneSynthesis').click(function () {
        $('#research-description-insertable').remove();
        
        $('<div/>',{'id':'research-description-insertable'}).html(
            $('<p>').html(polyyneSynthesisText).append(
                $('<button type="button" class="btn btn-default">').html('Back').click(function() {
                    $('#research-description-insertable').remove();
                }))
        ).appendTo('#research-description')
    });
});

            $('#researchBoxMolecularImaging').on('click', function () {
                currentDescription = 1;
                $('.research-description-insertable').hide(500);
                $('#researchDescription1').show(500);
                $('#researchNavbar').show(500);
            });

            $('#researchBoxPolyyneSynthesis').on('click', function () {
                currentDescription = 2;
                $('.research-description-insertable').hide(500);
                $('#researchDescription2').show(500);
                $('#researchNavbar').show(500);
            });

            $('#researchBoxPerfectChocolate').on('click', function () {
                currentDescription = 3;
                $('.research-description-insertable').hide(500);
                $('#researchDescription3').show(500);
                $('#researchNavbar').show(500);
            });

            $('#researchBoxMolecularMovies').on('click', function () {
                currentDescription = 4;
                $('.research-description-insertable').hide(500);
                $('#researchDescription4').show(500);
                $('#researchNavbar').show(500);
            });

            $('#researchBoxGrapheneOxide').on('click', function () {
                currentDescription = 5;
                $('.research-description-insertable').hide(500);
                $('#researchDescription5').show(500);
                $('#researchNavbar').show(500);
            });

            $('#researchBoxTeaching').on('click', function () {
                currentDescription = 6;
                $('.research-description-insertable').hide(500);
                $('#researchDescription6').show(500);
                $('#researchNavbar').show(500);
            });