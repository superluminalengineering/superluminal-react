import React from 'react';

interface Props {
    style?: React.CSSProperties
    userName: string
}

interface State { }

class ProfilePictureView extends React.Component<Props, State> {

    render() {
        const { style, userName } = this.props;
        const parts = userName.split(' ');
        let initials = parts[0].substring(0, 1).toUpperCase();
        if (parts.length > 1) {
            initials += parts[1].substring(0, 1).toUpperCase();
        }
        const combined = { ...styles.profilePictureView, ...style };
        return <div style={combined}>{initials}</div>;
    }
}

const styles = {

    profilePictureView: {
        borderRadius: '50%',
        border: 'solid',
        borderColor: '#FFFFFF33',
        borderWidth: '1px',
        width: '24px',
        height: '24px',
        background: '#2C67FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 600,
        color: '#FFFFFF',
    } as React.CSSProperties,
}

export default ProfilePictureView;
