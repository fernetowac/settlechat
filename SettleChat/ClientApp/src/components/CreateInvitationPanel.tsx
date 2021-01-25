﻿import * as React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { ThunkDispatch } from 'redux-thunk';
import { ApplicationState } from '../store/index';
import { Divider, Snackbar, InputAdornment, List, Box, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, Checkbox, FormControl, FormControlLabel, TextField } from '@material-ui/core';
import { Invitation, NewInvitation } from '../types/invitationTypes'
import { InvitationKnownAction } from '../types/invitationActionTypes'
import { createInvitation, requestInvitations } from '../thunks/invitationThunks'
import CloseIcon from '@material-ui/icons/Close';
import LinkIcon from '@material-ui/icons/Link';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useSnackbar } from 'notistack'

type CreateInvitationPanelState = {
    invitations: Invitation[];
    conversationId: string;
}
type CreateInvitationPanelProps = CreateInvitationPanelState & MapDispatchToPropsType;

function CreateInvitationPanel(props: CreateInvitationPanelProps) {
    const [isPermanent, setIsPermanent] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(true);
    const [coppiedToClipboardSnackbarOpened, setCoppiedToClipboardSnackbarOpened] = React.useState(false);
    const { conversationId } = props;
    const { requestInvitations } = props.actions;
    const { enqueueSnackbar } = useSnackbar();

    const handleAddInvitationSubmit = (evt: React.MouseEvent<HTMLButtonElement>) => {
        props.actions.createInvitation({ conversationId: conversationId, isPermanent: isPermanent });
    };

    const handleIsPermanentChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        setIsPermanent(evt.target.checked);
    };

    const handleOnCopyLink = (link: string) => {
        navigator.clipboard.writeText(link)
        setCoppiedToClipboardSnackbarOpened(true);
        enqueueSnackbar("Coppied to clipboard");
    }

    const handleOnCoppiedToClipboardSnackbarClose = () => {
        setCoppiedToClipboardSnackbarOpened(false);
    }

    const buildTokenLink = (token: string): string => `${window.location.origin}/invitation/${token}`

    React.useEffect(() => {
        let isMounted = true;
        requestInvitations(conversationId)
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, [requestInvitations, conversationId]);

    return (
        <div>
            <FormControl component="fieldset">
                <FormControlLabel
                    control={<Checkbox checked={isPermanent} onChange={handleIsPermanentChange} name="isPermanent" />}
                    label="Unconstrained"
                />
                <Button color="primary" variant="contained" onClick={handleAddInvitationSubmit}>Create invitation</Button>
            </FormControl>
            <Box>
                {
                    isLoading ?
                        'Loading..' :
                        (props.invitations.length === 0 ? '' :
                            <List>
                                {
                                    props.invitations.map((invitation) => {
                                        const invitationLink = buildTokenLink(invitation.token);
                                        return <React.Fragment key={invitation.id}>
                                            <ListItem key={invitation.id} dense>
                                                <ListItemText
                                                    primary={
                                                        <TextField
                                                            label="Invitation link"
                                                            InputProps={{
                                                                readOnly: true,
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <LinkIcon />
                                                                    </InputAdornment>
                                                                )
                                                            }}
                                                            fullWidth
                                                            margin="dense"
                                                            variant="outlined"
                                                            value={invitationLink}
                                                            onFocus={(evt) => evt.target.select()}
                                                        />
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton edge="end" onClick={() => handleOnCopyLink(invitationLink)}>
                                                        <FileCopyIcon />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                            <Divider key={`${invitation.id}_divider`} variant="middle" component="li" />
                                        </React.Fragment>
                                    })
                                }
                            </List>
                        )
                }
            </Box>
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={coppiedToClipboardSnackbarOpened}
                autoHideDuration={4000}
                onClose={handleOnCoppiedToClipboardSnackbarClose}
                message="Coppied to clipboard"
                action={
                    <IconButton size="small" aria-label="close" color="inherit" onClick={handleOnCoppiedToClipboardSnackbarClose}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                }
            />

        </div>
    );
}

const compareByCreatedAsc = (a: { created: Date }, b: { created: Date }): number => {
    if (a.created < b.created) {
        return -1;
    }
    else if (a.created > b.created) {
        return 1;
    }
    return 0;
}

const getInvitations = (state: ApplicationState, conversationId: string): Invitation[] => (
    state.conversation === undefined ?
        undefined :
        state.conversation.invitations
            .filter(invitation => invitation.conversationId === conversationId)
) || [];
const getSortedInvitations = (invitations: Invitation[]): Invitation[] => invitations.sort(compareByCreatedAsc);

/**
 * Memoized sorting of invitations
 */
const sortedInvitationsSelector = createSelector([getInvitations], getSortedInvitations);

type MapDispatchToPropsType = {
    actions: {
        requestInvitations: (conversationId: string) => Promise<Invitation[]>;
        createInvitation: (newInvitation: NewInvitation) => Promise<Invitation>;
    }
};
const mapDispatchToProps = (dispatch: ThunkDispatch<ApplicationState, undefined, InvitationKnownAction>): MapDispatchToPropsType => ({
    actions: {
        requestInvitations: (conversationId: string) => dispatch(requestInvitations(conversationId)),
        createInvitation: (newInvitation: NewInvitation) => dispatch(createInvitation(newInvitation))
    }
});

interface OwnProps {
    conversationId: string;
}

const mapStateToProps = (state: ApplicationState, ownProps: OwnProps): CreateInvitationPanelState => {
    return {
        invitations: sortedInvitationsSelector(state, ownProps.conversationId),
        conversationId: ownProps.conversationId
    } as CreateInvitationPanelState;
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CreateInvitationPanel as any);