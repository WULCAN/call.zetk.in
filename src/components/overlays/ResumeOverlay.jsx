import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage as Msg } from 'react-intl';

import { activeCalls } from '../../store/calls';
import CallOpList from '../misc/callOpList/CallOpList';
import { switchLaneToCall } from '../../actions/lane';


const mapStateToProps = state => ({
    activeCalls: activeCalls(state),
});

@connect(mapStateToProps)
export default class ResumeOverlay extends React.Component {
    render() {
        let callOpMsgPrefix = 'overlays.resume.ops';
        let callOps = [ 'resume' ];

        return (
            <div className="ResumeOverlay">
                <Msg tagName="h1" id="overlays.resume.h"/>
                <Msg tagName="p" id="overlays.resume.p"/>
                <CallOpList calls={ this.props.activeCalls }
                    opMessagePrefix={ callOpMsgPrefix }
                    ops={ callOps }
                    onCallOperation={ this.onCallOperation.bind(this) }
                    />
            </div>
        );
    }

    onCallOperation(call, op) {
        if (op == 'resume') {
            this.props.dispatch(switchLaneToCall(call));
        }
    }
}
