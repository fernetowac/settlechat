import * as React from 'react';
import { Route, Switch } from 'react-router';
import Layout from './components/Layout';
import Home from './components/Home';
import Counter from './components/Counter';
import FetchData from './components/FetchData';
import MessagesPanel from './components/MessagesPanel';
import NewConversation from './components/NewConversation';
import Token from './components/Token';
import AuthorizeRoute from './components/api-authorization/AuthorizeRoute';
import ApiAuthorizationRoutes from './components/api-authorization/ApiAuthorizationRoutes';
import { ApplicationPaths } from './components/api-authorization/ApiAuthorizationConstants';
import PageNotFound from './components/PageNotFound';
import * as Sentry from "@sentry/react";
import ErrorBoundaryFallback from './components/ErrorBoundaryFallback';

import './custom.css'

export default () => (
    <Layout>
        <Sentry.ErrorBoundary fallback={ErrorBoundaryFallback} showDialog>
            <Switch>
                <Route exact path='/' component={Home} />
                <Route path='/counter' component={Counter} />
                <AuthorizeRoute path='/fetch-data/:startDateIndex?' component={FetchData} />
                <AuthorizeRoute path='/conversation/:conversationId' component={MessagesPanel} />
                <Route path='/start-conversation' component={NewConversation} />
                <Route path='/token/:token' component={Token} />
                <Route path={ApplicationPaths.ApiAuthorizationPrefix} component={ApiAuthorizationRoutes} />
                <Route path='*' component={PageNotFound} />
            </Switch>
        </Sentry.ErrorBoundary>
    </Layout>
);
