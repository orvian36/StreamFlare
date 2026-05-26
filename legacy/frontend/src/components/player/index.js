import React, { useState, useContext, createContext, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { Container, Button, Overlay, Inner, Close } from './styles/player';
import VideoPlayer from 'react-video-js-player';
import ReactPlayer from 'react-player';
import {AuthContext} from './../../context/auth-context';
export const PlayerContext = createContext();

export default function Player({ children, ...restProps }) {
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(()=>{
    console.log(restProps);
  });

  return (
    <PlayerContext.Provider value={{ showPlayer, setShowPlayer }}>
      <Container {...restProps}>{children}</Container>
    </PlayerContext.Provider>
  );
}

Player.Video = function PlayerVideo({ src, itemFeature, ...restProps }) {
  const { showPlayer, setShowPlayer } = useContext(PlayerContext);
  
  const ref = React.createRef();
  const auth = useContext(AuthContext);

  const [ videoUrl, setVideoUrl ] = useState(null);
  useEffect(() => {
    const options = {
      method: 'GET',
      url: `https://api.themoviedb.org/3/movie/${itemFeature.MOVIE_ID}/videos`,
      params: {
        language: 'en-US',
        api_key: '36af2cf1e5a1653dc592ba192d078c86'
      }
    };

    axios
      .request(options)
      .then(function (response) {
        // Assuming the structure of the response.data includes a video URL
        const videoUrlFromAPI = response.data.results[0]?.key || null;
        console.log(videoUrlFromAPI);
        setVideoUrl(`https://www.youtube.com/watch?v=${videoUrlFromAPI}`);
      })
      .catch(function (error) {
        console.error(error);
      });

    // The dependency array is empty, so this effect runs once when the component mounts.
  }, [videoUrl]);

  async function saveTime (event){
    console.log('Paused');
    const time = ref.current.getCurrentTime();
    
    const response = await fetch('http://localhost:5000/api/profiles/time/set', {
        method: 'POST',
        headers: {
              'Content-Type' : 'application/json',
        },
        body: JSON.stringify({
          email: auth.email,
          profile_id : auth.profile,
          movie_id: itemFeature.MOVIE_ID,
          show_id : itemFeature.SHOW_ID,
          watched_upto : time,
          episode_no : itemFeature.EPISODE_NO,
          season_no : itemFeature.SEASON_NO
        })
    });


    const responseData = await response.json();
    console.log(responseData);
    
  }

  async function getTime (event){
    let response;
    try{
      if (itemFeature.MOVIE_ID) response = await fetch(`http://localhost:5000/api/profiles/time/get/?email=${auth.email}&profile_id=${auth.profile}&movie_id=${itemFeature.MOVIE_ID}`);
      else if (itemFeature.SHOW_ID) response = await fetch(`http://localhost:5000/api/profiles/time/get/?email=${auth.email}&profile_id=${auth.profile}&show_id=${itemFeature.SHOW_ID}&episode_no=${itemFeature.EPISODE_NO}&season_no=${itemFeature.SEASON_NO}`);
      const responseData = await response.json();
      if (response.status === 200) ref.current.seekTo(responseData.WATCHED_UPTO, 'seconds');
    } catch(err){
      console.log(err);
    }
  }

  return showPlayer
    ? ReactDOM.createPortal(
        <Overlay onClick={() => setShowPlayer(false)} data-testid="player">
          <Inner>
            <ReactPlayer
            ref = {ref} 
            controls
            url = { videoUrl ? videoUrl : 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
            // onPause = {(event) => { saveTime(event);}}
            // onPlay = {event => getTime(event)}
            />
            <Close />
          </Inner>
        </Overlay>,
        document.body
      )
    : null;
};

Player.Button = function PlayerButton({ ...restProps }) {
  const { showPlayer, setShowPlayer } = useContext(PlayerContext);

  return (
    <Button onClick={() => setShowPlayer((showPlayer) => !showPlayer)} {...restProps}>
      Play
    </Button>
  );
};
