import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import * as ROUTES from './constants/routes';
import {
  Home, Signin, Signup, Browse, Profiles, CreateProfile, AddSubscription, AccountSettings, UpdateSubscription, CancelSubscription,
  UpdatePassword, SubscriptionHistory, DeleteProfile, ProfileInfo, UpdatePhone, MovieHistory, ShowHistory
} from './pages';
import { AuthContext } from './context/auth-context';


function App() {

  const [token, setToken] = useState(false);
  const [email, setEmail] = useState(false);
  const [profile, setProfile] = useState(false);
  const [sub_id, set_Sub_Id] = useState(false);
  const [bill, set_Bill] = useState(false);
  const [max_profiles, set_MaxProfiles] = useState(false);
  const [ptbd, set_PTBD] = useState(false);
  const [num_profiles, set_NumProfiles] = useState(false);




  const login = useCallback((email, token) => {
    setToken(token);
    setEmail(email);
    localStorage.setItem('userData', JSON.stringify({
      email : email,
      token : token
    }))
  }, []);

  // useEffect ( () => {
  //   const storedData = JSON.parse(localStorage.getItem('userData'));
  //   if (storedData && storedData.token){
  //     login(storedData.email, storedData.token);
  //   } 
  // }, []);

  const set_sub_id = useCallback((subid) => {
    set_Sub_Id(subid);
  }, []);

  const set_bill = useCallback((b) => {
    set_Bill(b);
  }, []);

  const set_ptbd = useCallback((d) => {
    set_PTBD(d);
  }, []);

  const set_max_profiles = useCallback((mp) => {
    set_MaxProfiles(mp);
  }, []);

  const set_num_profiles = useCallback((np) => {
    set_NumProfiles(np);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
    localStorage.removeItem('userData');
  }, []);

  let routes;

  if (!token) {
    routes = (

      <Routes>
        <React.Fragment>
          <Route exact path={ROUTES.HOME} element={<Home />} />
          <Route exact path={ROUTES.SIGN_UP} element={<Signup />} />
          <Route exact path={ROUTES.SIGN_IN} element={<Signin />} />
        </React.Fragment>
      </Routes>
    );
  } else {
    routes = (
      <Routes >
        <React.Fragment>
          <Route exact path={ROUTES.HOME} element={<Home />} />
          <Route exact path={ROUTES.PROFILE_INFO} element={<ProfileInfo />} />
          <Route exact path={ROUTES.CREATE_PROFILE} element={<CreateProfile />} />
          <Route exact path={ROUTES.DELETE_PROFILE} element={<DeleteProfile />} />
          <Route exact path={ROUTES.BROWSE} element={<Browse />} />
          <Route exact path={ROUTES.ADD_SUBSCRIPTION} element={<AddSubscription />} />
          <Route exact path={ROUTES.UPDATE_SUBSCRIPTION} element={<UpdateSubscription />} />
          <Route exact path={ROUTES.UPDATE_PHONE} element={<UpdatePhone />} />
          <Route exact path={ROUTES.UPDATE_PASSWORD} element={<UpdatePassword />} />
          <Route exact path={ROUTES.CANCEL_SUBCRIPTION} element={<CancelSubscription />} />
          <Route exact path={ROUTES.MOVIE_HISTORY} element={<MovieHistory />} />
          <Route exact path={ROUTES.SHOW_HISTORY} element={<ShowHistory />} />
          <Route exact path={ROUTES.SUBSCRIPTION_HISTORY} element={<SubscriptionHistory />} />
          <Route exact path={ROUTES.ACCOUNT_SETTINGS} element={<AccountSettings />} />
        </React.Fragment>
      </Routes >

    );
  }


  return (
    <AuthContext.Provider value={{
      email: email,
      token: token,
      sub_id: sub_id,
      bill: bill,
      max_profiles: max_profiles,
      num_profiles: num_profiles,
      ptbd: ptbd,
      login: login,
      logout: logout,
      set_sub_id: set_sub_id,
      set_bill: set_bill,
      set_max_profiles: set_max_profiles,
      set_num_profiles: set_num_profiles,
      set_ptbd: set_ptbd,
      profile: profile,
      isLoggedIn: !!token
    }}>
      <Router>
        {routes}
      </Router>
    </AuthContext.Provider>
  );
}


export default App;
