const axios = require('axios');

const getMovieData = async (listOfId) => {
  const movieDataList = await Promise.all(
    listOfId.map(async (id) => {
      try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}?language=en-US&api_key=36af2cf1e5a1653dc592ba192d078c86`);
        return {
          DESCRIPTION: response.data.overview,
          IMAGE_URL: `https://image.tmdb.org/t/p/w500${response.data.poster_path}`,
          MOVIE_ID: response.data.id,
          RATING: response.data.vote_average,
          RELEASE_DATE: response.data.release_date,
          TIME: response.data.runtime,
          TITLE: response.data.title,
          VIDEO_URL: `https://www.youtube.com/watch?v=${response.data.video_url}`
        };
      } catch (error) {
        console.error(`Error fetching movie data for ID ${id}: ${error.message}`);
        return null;
      }
    })
  );

  return movieDataList.filter(data => data !== null);
};

// Example usage with a list of movie IDs
getMovieData([19995, 12345, 67890])
  .then(movieDataList => {
    console.log(movieDataList);
  })
  .catch(error => {
    console.error(`Error fetching movie data: ${error.message}`);
  });
