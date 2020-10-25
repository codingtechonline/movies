(async ($d3, $genres, $months, $headers) => {
  const rangeOfYears = (start, end) =>
    Array(end - start + 1)
      .fill(start)
      .map((year, index) => year + index);

  const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  };

  const createLoadingAnimation = () => {
    const loadingAnimation = $d3.create('div').attr('class', 'lds-facebook');
    loadingAnimation.append('div');
    loadingAnimation.append('div');
    loadingAnimation.append('div');
    return loadingAnimation;
  };

  const minYear = 1950;
  const maxYear = new Date().getFullYear();

  const mainContainer = $d3
    .select('body')
    .append('div')
    .attr('id', 'mainContainer')
    .attr('class', 'container');

  mainContainer.append('h1').attr('id', 'top').text('TMDB New Releases');

  const optionsDiv = mainContainer.append('div').attr('id', 'options');
  const yearDiv = optionsDiv.append('div').attr('id', 'year');
  const genreDiv = optionsDiv.append('div').attr('id', 'genre');

  const monthsDiv = mainContainer.append('div').attr('id', 'months');
  const movieDataDiv = mainContainer.append('div').attr('id', 'movieData');

  // create year select list
  yearDiv.append('label').attr('class', 'select-label').text('Select Year:');

  const yearSelect = yearDiv
    .append('select')
    .attr('id', 'yearSelect')
    .on('change', function (event) {
      const currentGenre = document.getElementById('genreSelect').value;
      const currentYear = document.getElementById('yearSelect').value;
      getMovieDataForYear(currentYear, currentGenre);
    });

  yearSelect
    .selectAll('option')
    .data(rangeOfYears(minYear, maxYear).reverse())
    .enter()
    .append('option')
    .text(function (d) {
      return d;
    });

  // create genre select list
  genreDiv.append('label').attr('class', 'select-label').text('Select Genre:');

  const genreSelect = genreDiv
    .append('select')
    .attr('id', 'genreSelect')
    .on('change', function (event) {
      const currentGenre = document.getElementById('genreSelect').value;
      const currentYear = document.getElementById('yearSelect').value;
      getMovieDataForYear(currentYear, currentGenre);
    });

  genreSelect
    .selectAll('option')
    .data($genres)
    .enter()
    .append('option')
    .text(function (d) {
      return d.name;
    })
    .attr('value', function (d) {
      return d.id;
    });

  const getMovieDataForYear = async (year, genre) => {
    // clear
    monthsDiv.html('');
    movieDataDiv.html('');

    // create month links
    monthsDiv
      .selectAll('div')
      .data($months)
      .enter()
      .append('a')
      .attr('class', 'month-name')
      .attr('href', function (d) {
        return `#${d}-${year}`;
      })
      .text(function (d) {
        return d;
      });

    // get data for each month
    await asyncForEach($months, async (month, index) => {
      const movieDataElement = movieDataDiv.append('div');
      try {
        movieDataElement.append(() => createLoadingAnimation().node());

        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}${
          genre ? `&with_genres=${genre}` : ''
        }&region=US&with_release_type=3|2&primary_release_date.gte=${year}-${(
          '0' +
          (index + 1)
        ).slice(-2)}-01&primary_release_date.lte=${year}-${(
          '0' +
          (index + 1)
        ).slice(-2)}-31`;

        const movieData = await $d3.json(url);

        movieDataElement.selectAll('.lds-facebook').remove();

        const monthDiv = movieDataDiv
          .append('div')
          .attr('id', `${month}-${year}`)
          .attr('class', 'month-container');

        const monthDivHeader = monthDiv
          .append('div')
          .attr('class', 'month-header');

        monthDivHeader
          .append('div')
          .attr('class', 'header-container')
          .append('h4')
          .text(`${month} ${year}`);

        monthDivHeader.append('a').attr('href', '#top').text('top');

        // create data table
        const table = monthDiv
          .append('table')
          .attr('class', 'table')
          .attr('class', 'movie-table');

        const filteredMovieData = movieData.results.map((d) => {
          return $headers.reduce((acc, curr) => {
            acc[curr] = d[curr];
            return acc;
          }, {});
        });

        console.log('filteredMovieData', filteredMovieData);

        // add table headers
        table
          .append('thead')
          .append('tr')
          .selectAll('th')
          .data($headers)
          .enter()
          .append('th')
          .text(function (d) {
            return d === 'genre_ids' ? 'genres' : d.replace('_', ' ');
          })
          .attr('class', 'movie-table-head');

        // add table data
        table
          .append('tbody')
          .selectAll('tr')
          .data(filteredMovieData)
          .enter()
          .append('tr')
          .selectAll('td')
          .data(function (d) {
            return Object.keys(d).map((key) => d[key]);
          })
          .enter()
          .append('td')
          .attr('class', 'movie-table-body')
          .text(function (d, index) {
            return index === $headers.length - 1
              ? d.map((i) => $genres.find((g) => g.id === i).name).join(', ')
              : d;
          });
      } catch (error) {
        console.log('error', error);
        // display error
        movieDataElement.selectAll('.lds-facebook').remove();
        movieDataDiv
          .append('h2')
          .text(`${month}-${year} - Error Retrieving Data`);
      }
    });
  };

  await getMovieDataForYear(2020, $genres[0].id);
})(d3, genres, months, desiredHeaders);
