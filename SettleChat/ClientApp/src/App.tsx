import { Route, Switch, RouteComponentProps } from 'react-router'
import Layout from './components/Layout'
import Notifier from './components/Notifier'
import RecentConversationRedirection from './components/RecentConversationRedirection'
import Home from './components/Home'
import MessagesPanelContainer from './components/MessagesPanelContainer'
import NewConversation from './components/NewConversation'
import Token from './components/Token'
import InvitationAcceptanceContainer from './components/InvitationAcceptanceContainer'
import AuthorizeRoute from './components/api-authorization/AuthorizeRoute'
import ApiAuthorizationRoutes from './components/api-authorization/ApiAuthorizationRoutes'
import { ApplicationPaths } from './components/api-authorization/ApiAuthorizationConstants'
import PageNotFound from './components/PageNotFound'
import * as Sentry from '@sentry/react'
import ErrorBoundaryFallback from './components/ErrorBoundaryFallback'
import SignalRContainer from './components/SignalRContainer'
import { CssBaseline, ThemeProvider, createMuiTheme, responsiveFontSizes } from '@material-ui/core'
import { SnackbarProvider } from 'notistack'

import './custom.css'

const theme = responsiveFontSizes(
    createMuiTheme({
        typography: {
            fontSize: 14,
        },
        zIndex: {
            snackbar: 10000,
        },
    })
)

export default () => (
    <ThemeProvider theme={theme}>
        <SnackbarProvider>
            <CssBaseline />
            <Notifier />
            <Switch>
                <Route path="/token/:token" component={Token} />
                <Route
                    exact
                    path="/invitation/:token/:step?"
                    render={(props) => (
                        <InvitationAcceptanceContainer
                            token={props.match.params.token}
                            step={parseInt(props.match.params.step || '0')}
                        />
                    )}
                />
                <Route
                    path={ApplicationPaths.ApiAuthorizationPrefix}
                    component={ApiAuthorizationRoutes}
                />
                <Layout>
                    <Sentry.ErrorBoundary fallback={ErrorBoundaryFallback} showDialog>
                        <Switch>
                            <AuthorizeRoute
                                exact
                                path="/"
                                component={RecentConversationRedirection}
                            />
                            <Route exact path="/home" component={Home} />
                            <AuthorizeRoute
                                path="/conversation/:conversationId"
                                render={(props: RouteComponentProps<any>) => (
                                    <SignalRContainer>
                                        <MessagesPanelContainer {...props} />
                                    </SignalRContainer>
                                )}
                            />
                            <Route path="/start-conversation" component={NewConversation} />
                            <Route path="*" component={PageNotFound} />
                        </Switch>
                    </Sentry.ErrorBoundary>
                </Layout>
            </Switch>
        </SnackbarProvider>
    </ThemeProvider>
)
