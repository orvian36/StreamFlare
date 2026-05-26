'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Card, Loading, Player, Profiles } from '@streamflare/ui';
import { useAuth } from '../../context/auth-context';
import { api } from '../../lib/api-client';
import selectionFilter from '../../utils/selection-filter';
import * as ROUTES from '../../constants/routes';
import { FooterContainer } from '../../containers/footer';

interface Profile {
  PROFILE_ID: string;
  DOB: string | null;
}

interface SlideItem {
  title: string;
  data: any[];
}

export default function BrowsePage() {
  const auth = useAuth();
  const router = useRouter();

  // Profile-related state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [profileIndex, setProfileIndex] = useState(1);

  // Content-related state
  const [category, setCategory] = useState<'films' | 'series' | 'watchlist' | 'suggestions' | 'new' | 'search'>('films');
  const [movies, setMovies] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [slideRows, setSlideRows] = useState<SlideItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [prevCategory, setPrevCategory] = useState<'films' | 'series' | 'watchlist' | 'suggestions' | 'new' | 'search' | ''>('');

  // 1. Initial redirect & Profile fetch
  useEffect(() => {
    if (!auth.token) {
      router.push(ROUTES.SIGN_IN);
      return;
    }

    if (auth.email) {
      api
        .get<{ profile: Profile[] }>(`/api/profiles/${auth.email}`)
        .then((res) => {
          const profileList = res.data.profile ?? [];
          setProfiles(profileList);
          auth.set_num_profiles(profileList.length);
        })
        .catch((err) => console.error(err))
        .finally(() => setProfilesLoading(false));
    }
  }, [auth.token, auth.email, router]);

  // 2. Fetch movies/shows for selection filter on demand
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const [moviesRes, showsRes] = await Promise.all([
        api.get<{ movies: any[] }>('/api/browse/movies/all'),
        api.get<{ shows: any[] }>('/api/browse/shows/all'),
      ]);
      setMovies(moviesRes.data.movies ?? []);
      setShows(showsRes.data.shows ?? []);
    } catch (err) {
      console.error('Failed to fetch browse content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch watchlist
  const fetchWatchList = useCallback(async (profId: string) => {
    try {
      const response = await api.post<{ arr: SlideItem[] }>('/api/profiles/watchlist/get', {
        EMAIL: auth.email,
        PROFILE_ID: profId,
      });
      if (response.data.arr) {
        setSlideRows(response.data.arr);
      }
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    }
  }, [auth.email]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (profId: string) => {
    try {
      const response = await api.get<SlideItem[]>(
        `/api/browse/suggestions?email=${auth.email}&profile_id=${profId}`
      );
      setSlideRows(response.data ?? []);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  }, [auth.email]);

  // Fetch new and popular
  const fetchNewAndPopular = useCallback(async () => {
    try {
      const response = await api.get<SlideItem[]>(`/api/browse/new?email=${auth.email}`);
      setSlideRows(response.data ?? []);
    } catch (err) {
      console.error('Failed to fetch new & popular:', err);
    }
  }, [auth.email]);

  // Fetch continue watching and merge
  const mergeContinueWatching = useCallback(async (profId: string, currentCategory: 'films' | 'series', baseSlides: SlideItem[]) => {
    try {
      const endpoint = currentCategory === 'films'
        ? `/api/profiles/movie/continue?profile_id=${profId}&email=${auth.email}`
        : `/api/profiles/show/continue?profile_id=${profId}&email=${auth.email}`;
      const response = await api.get<SlideItem>(endpoint);
      const continueRow = response.data;

      if (continueRow && continueRow.data && continueRow.data.length > 0) {
        // filter out any existing continue watching row
        const cleaned = baseSlides.filter(row => row.title !== 'Continue Watching');
        setSlideRows([continueRow, ...cleaned]);
      } else {
        setSlideRows(baseSlides);
      }
    } catch (err) {
      console.error('Failed to fetch continue watching:', err);
      setSlideRows(baseSlides);
    }
  }, [auth.email]);

  // 3. Setup and handle search
  const handleSearch = useCallback(async (keyword: string) => {
    const searchKey = keyword.split(':');
    if ((searchKey.length - 1) % 2 === 0) {
      try {
        const response = await api.post<SlideItem[]>('/api/browse/search', {
          ss: searchKey.length === 1 ? 'static' : searchKey[0],
          key: searchKey.length === 1 ? searchKey[0] : searchKey.slice(1),
        });
        if (response.status === 200) {
          setSlideRows(response.data);
        }
      } catch (err) {
        console.error('Failed searching content:', err);
      }
    }
  }, []);

  // Search input change side-effects
  useEffect(() => {
    if (searchTerm.length === 1 && prevCategory === '') {
      setPrevCategory(category);
      setCategory('search');
    }
    if (searchTerm.length === 0 && prevCategory !== '') {
      setCategory(prevCategory as any);
      setPrevCategory('');
    }
    if (searchTerm.length >= 4) {
      handleSearch(searchTerm);
    }
  }, [searchTerm, prevCategory, category, handleSearch]);

  // 4. Category / Profile side-effects
  useEffect(() => {
    if (!selectedProfile) return;

    if (category === 'films' || category === 'series') {
      const filtered = selectionFilter({ series: shows, films: movies });
      const baseSlides = category === 'films' ? filtered.films : filtered.series;
      mergeContinueWatching(selectedProfile, category, baseSlides);
    } else if (category === 'watchlist') {
      fetchWatchList(selectedProfile);
    } else if (category === 'suggestions') {
      fetchSuggestions(selectedProfile);
    } else if (category === 'new') {
      fetchNewAndPopular();
    }
  }, [category, selectedProfile, movies, shows, fetchWatchList, fetchSuggestions, fetchNewAndPopular, mergeContinueWatching]);

  // 5. Select Profile Action
  const handleSelectProfile = (profileId: string, idx: number) => {
    setSelectedProfile(profileId);
    setProfileIndex(idx + 1);
    auth.set_profile(profileId);
    auth.set_ptbd(idx);
    
    // Fetch all content if not loaded yet
    fetchContent();

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  // Render profile selection if not selected yet
  if (!selectedProfile) {
    return (
      <>
        <Header bg={false}>
          <Header.Frame>
            <Header.Logo to={ROUTES.HOME} src="/images/logo.svg" alt="StreamFlare" />
            {profiles.length < (auth.max_profiles ?? 0) ? (
              <Header.ButtonLink to={ROUTES.CREATE_PROFILE}>Create Profile</Header.ButtonLink>
            ) : (
              <Header.ButtonLink
                to={ROUTES.SIGN_IN}
                onClick={() => {
                  auth.logout();
                }}
              >
                Log Out
              </Header.ButtonLink>
            )}
          </Header.Frame>
        </Header>

        <Profiles>
          <Profiles.Title>Who&apos;s watching?</Profiles.Title>
          {profilesLoading ? (
            <div style={{ textAlign: 'center', color: 'white', marginTop: '20px' }}>Loading...</div>
          ) : (
            <Profiles.List>
              {profiles.map((p, index) => (
                <Profiles.User key={p.PROFILE_ID} onClick={() => handleSelectProfile(p.PROFILE_ID, index)}>
                  <Profiles.Picture src={(index + 1).toString()} />
                  <Profiles.Name>{p.PROFILE_ID}</Profiles.Name>
                </Profiles.User>
              ))}
            </Profiles.List>
          )}
        </Profiles>
      </>
    );
  }

  return (
    <>
      {loading ? <Loading src={profileIndex.toString()} /> : <Loading.ReleaseBody />}

      <Header dontShowOnSmallViewPort>
        <Header.Frame>
          <Header.Group>
            <Header.Logo to={ROUTES.BROWSE} src="/images/logo.svg" alt="StreamFlare" />
            <Header.TextLink
              active={category === 'series' ? 'true' : 'false'}
              onClick={() => {
                setCategory('series');
                setSearchTerm('');
              }}
            >
              Shows
            </Header.TextLink>
            <Header.TextLink
              active={category === 'films' ? 'true' : 'false'}
              onClick={() => {
                setCategory('films');
                setSearchTerm('');
              }}
            >
              Movies
            </Header.TextLink>
            <Header.TextLink
              active={category === 'watchlist' ? 'true' : 'false'}
              onClick={() => {
                setCategory('watchlist');
                setSearchTerm('');
              }}
            >
              WatchList
            </Header.TextLink>
            <Header.TextLink
              active={category === 'suggestions' ? 'true' : 'false'}
              onClick={() => {
                setCategory('suggestions');
                setSearchTerm('');
              }}
            >
              Suggestions
            </Header.TextLink>
            <Header.TextLink
              active={category === 'new' ? 'true' : 'false'}
              onClick={() => {
                setCategory('new');
                setSearchTerm('');
              }}
            >
              New and Popular
            </Header.TextLink>
          </Header.Group>

          <Header.Group>
            <Header.Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <Header.Profile>
              <Header.Picture src={profileIndex.toString()} />
              <Header.Dropdown>
                <Header.Group>
                  <Header.Picture src={profileIndex.toString()} />
                  <Header.TextLink>{selectedProfile}</Header.TextLink>
                </Header.Group>
                <Header.Group>
                  <Header.TextLink onClick={() => router.push(ROUTES.ACCOUNT_SETTINGS)}>
                    Settings
                  </Header.TextLink>
                </Header.Group>
                <Header.Group>
                  <Header.TextLink
                    onClick={() => {
                      auth.logout();
                      router.push(ROUTES.SIGN_IN);
                    }}
                  >
                    Sign Out
                  </Header.TextLink>
                </Header.Group>
              </Header.Dropdown>
            </Header.Profile>
          </Header.Group>
        </Header.Frame>

        {(category === 'films' || category === 'series') && (
          <Header.Feature>
            <Header.FeatureCallOut>Watch Joker Now</Header.FeatureCallOut>
            <Header.Text>
              Forever alone in a crowd, failed comedian Arthur Fleck seeks connection as he walks the streets of Gotham
              City. Arthur wears two masks -- the one he paints for his day job as a clown, and the guise he projects in a
              futile attempt to feel like he&apos;s part of the world around him.
            </Header.Text>
            <Player>
              <Player.Button />
              <Player.Video videoUrl="/videos/bunny.mp4" />
            </Player>
          </Header.Feature>
        )}
      </Header>

      <Card.Group>
        {slideRows && slideRows.length > 0 ? (
          slideRows.map((slideItem) => (
            <Card key={`${category}-${slideItem.title.toLowerCase()}`}>
              <Card.Title>{slideItem.title}</Card.Title>
              <Card.Entities>
                {slideItem.data && slideItem.data.length > 0 ? (
                  slideItem.data.map((item) => (
                    <Card.Item key={item.MOVIE_ID || item.SHOW_ID} item={item}>
                      <Card.Image src={`https://image.tmdb.org/t/p/w780${item.IMAGE_URL}`} />
                      <Card.Meta>
                        <Card.SubTitle>{item.TITLE}</Card.SubTitle>
                        {item.SEASON_NO && item.EPISODE_NO && (
                          <Card.SubTitle>
                            {`Season ${item.SEASON_NO} Episode ${item.EPISODE_NO}`}
                          </Card.SubTitle>
                        )}
                        <Card.Text>★ {item.RATING ? item.RATING.toFixed(1) : 'N/A'}</Card.Text>
                      </Card.Meta>
                    </Card.Item>
                  ))
                ) : (
                  <div style={{ color: '#aaa', paddingLeft: '56px' }}>No items available</div>
                )}
              </Card.Entities>
              <Card.Feature category={category}>
                <Player>
                  <Player.Button style={{ marginTop: '20px' }} />
                  <Player.Video videoUrl={null} />
                </Player>
              </Card.Feature>
            </Card>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
            No films or shows found for this selection.
          </div>
        )}
      </Card.Group>

      <FooterContainer />
    </>
  );
}
