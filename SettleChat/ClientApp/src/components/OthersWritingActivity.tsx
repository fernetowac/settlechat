﻿import * as React from 'react'
import { connect } from 'react-redux'
import { ApplicationState } from '../store/index'
import { useIsMounted } from '../hooks/useIsMounted'
import { selectUserById } from '../store/users'
import { WritingActivity } from '../store/writingActivities'
import { conversationUsersByConversationIdSelector } from '../store/conversationUsers'

interface UserWriting {
    name: string
    lastTimeWritingClientUnixTimeInMs: number
}

const writingActivityNotificationThresholdMiliseconds = 10 * 1000

function equalArrays(array1: string[], array2: string[]) {
    if (array1.length !== array2.length) {
        return false
    }

    array1 = array1.slice()
    array1.sort()
    array2 = array2.slice()
    array2.sort()

    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]) {
            return false
        }
    }

    return true
}

/**
 * Displays writing activity of other people if it is new enough (to prevent being stuck in "John is writing.." status when there are connection problems on my side or other people's side)
 * @param props
 */
function OthersWritingActivity(props: ReturnType<typeof mapStateToProps>) {
    const [userNamesWriting, setUserNamesWriting] = React.useState(new Array<string>())
    const [othersWritingTimer, setOthersWritingTimer] = React.useState<
        ReturnType<typeof setTimeout>
    >()
    const isMounted = useIsMounted()

    const getUserNamesCurrentlyWriting = (usersWriting: UserWriting[]): string[] => {
        const thresholdClientUnixTimeInMs =
            new Date().getTime() - writingActivityNotificationThresholdMiliseconds
        return usersWriting
            .filter((x) => x.lastTimeWritingClientUnixTimeInMs >= thresholdClientUnixTimeInMs)
            .map((x) => x.name)
    }

    const resetUsersWritingIfNeeded = (unfilteredOthersWriting: UserWriting[]): string[] => {
        const userNamesCurrentlyWriting = getUserNamesCurrentlyWriting(unfilteredOthersWriting)
        if (!equalArrays(userNamesWriting, userNamesCurrentlyWriting)) {
            console.debug(userNamesWriting)
            console.debug(userNamesCurrentlyWriting)
            setUserNamesWriting(userNamesCurrentlyWriting)
        }
        return userNamesCurrentlyWriting
    }

    React.useEffect(() => {
        const userNamesCurrentlyWriting = resetUsersWritingIfNeeded(props.othersWriting)
        if (userNamesCurrentlyWriting.length) {
            setOthersWritingTimer(
                setInterval(() => {
                    if (isMounted()) {
                        resetUsersWritingIfNeeded(props.othersWriting)
                    }
                }, 500)
            )
        }
        return () => {
            console.debug(
                'OthersWritingActivity useEffect[props.othersWriting,othersWriting] cleanup'
            )
            if (othersWritingTimer) {
                window.clearTimeout(othersWritingTimer)
                if (isMounted()) {
                    setOthersWritingTimer(undefined)
                }
            }
        }
    }, [props.othersWriting, userNamesWriting])

    const renderUsersCurrentlyWriting = (userNamesCurrentlyWriting: string[]) => {
        switch (userNamesCurrentlyWriting.length) {
            case 0:
                return ''
            case 1:
                return `${userNamesCurrentlyWriting[0]} is writing..`
            default:
                return `${userNamesCurrentlyWriting.join(', ')} are writing..`
        }
    }

    if (!props.isAuthenticated) {
        return 'User must be authenticated'
    }
    return renderUsersCurrentlyWriting(userNamesWriting)
}

interface OwnProps {
    conversationId: string
}

// Selects which state properties are merged into the component's props
const mapStateToProps = (state: ApplicationState, ownProps: OwnProps) => {
    if (!state.identity) {
        throw new Error('Identity not initialized')
    }
    if (!state.identity.userId) {
        return {
            othersWriting: [],
            isAuthenticated: false,
        }
    }

    /** memoized conversationUsers by conversation id */
    const conversationUsers = conversationUsersByConversationIdSelector(state, ownProps)

    function getNicknameWithFallback(state: ApplicationState, userId: string) {
        const conversationUser = conversationUsers.find((x) => x.userId)
        if (conversationUser && conversationUser.nickname) {
            return conversationUser.nickname
        }
        const user = selectUserById(state, userId)
        return (user && user.userName) || 'somebody'
    }
    return {
        //TODO: use memoized selectors (https://redux.js.org/recipes/computing-derived-data)
        othersWriting: state.conversation.writingActivities
            .filter(
                (writingActivity) =>
                    writingActivity.userId !== state.identity.userId &&
                    writingActivity.activity === WritingActivity.IsWriting &&
                    writingActivity.lastChangeClientUnixTimeInMs >=
                        new Date().getTime() - writingActivityNotificationThresholdMiliseconds
            )
            .map((writingActivity) => {
                return {
                    name: getNicknameWithFallback(state, writingActivity.userId),
                    lastTimeWritingClientUnixTimeInMs: writingActivity.lastChangeClientUnixTimeInMs,
                } as UserWriting
            }),
        isAuthenticated: true,
    }
}

export default connect(mapStateToProps)(OthersWritingActivity as any)
