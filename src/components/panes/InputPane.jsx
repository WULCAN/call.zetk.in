import React from 'react';
import immutable from 'immutable';
import { connect } from 'react-redux';
import { FormattedDate, FormattedMessage as Msg } from 'react-intl';

import Button from '../../common/misc/Button';
import CampaignForm from '../../common/campaignForm/CampaignForm';
import FormattedLink from '../../common/misc/FormattedLink';
import LoadingIndicator from '../../common/misc/LoadingIndicator';
import PaneBase from './PaneBase';
import { campaignById } from '../../store/campaigns';
import { retrieveActions, updateActionResponse } from '../../actions/action';
import { retrieveCampaigns } from '../../actions/campaign';


const mapStateToProps = state => ({
    actions: state.get('actions'),
    campaigns: state.get('campaigns'),
});

@connect(mapStateToProps)
export default class InputPane extends PaneBase {
    constructor(props) {
        super(props);

        this.state = {
            viewMode: 'summary',
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.step === 'report' || nextProps.step === 'prepare') {
            // Go back to summary mode when reporting and when navigating
            // back to prepare step (e.g. after a skip).
            this.setState({
                viewMode: 'summary',
            });
        }
    }

    componentDidMount() {
        this.props.dispatch(retrieveActions());
    }

    renderContent() {
        let target = this.props.call.get('target');
        let content = null;

        if (this.state.viewMode == 'summary') {
            let campaignStore = this.props.campaigns;
            let campaignContent = null;

            if (campaignStore.getIn(['campaignList', 'isPending'])) {
                campaignContent = <LoadingIndicator/>;
            }
            else {
                let listItems = campaignStore.getIn(['campaignList', 'items']);

                if (listItems) {
                    campaignContent = (
                        <ul className="InputPane-summaryList">
                        { listItems.toList().map(campaign => {
                            let id = campaign.get('id');
                            let userActions = target.get('future_actions')
                                .filter(a => a.getIn(['campaign', 'id']) == id);

                            let targetActions = this.props.actions
                                .getIn(['byTarget', target.get('id').toString()]);

                            let userResponses = immutable.List();

                            if (targetActions) {
                                userResponses = targetActions
                                    .getIn(['responseList', 'items'])
                                    .filter(r => {
                                        let actionId = r.get('action_id').toString();
                                        let action = this.props.actions
                                            .getIn(['actionList', 'items', actionId]);

                                        return action.getIn(['campaign', 'id']) == id;
                                    });
                            }

                            let campaignActions = this.props.actions
                                .getIn(['actionList', 'items'])
                                .filter(a => a.getIn(['campaign', 'id']) == id);

                            let active = (this.props.step === "call")
                                ? true : false;

                            return (
                                <CampaignListItem key={ campaign.get('id') }
                                    actions={ campaignActions }
                                    userActions={ userActions }
                                    userResponses={ userResponses }
                                    target={ target }
                                    campaign={ campaign }
                                    isActive={ active }
                                    onSelect={ this.onCampaignSelect.bind(this) }/>
                            );
                        }) }
                        </ul>
                    );
                }
                else {
                    campaignContent = null;
                }
            }

            content = (
                <div key="content" className="InputPane-summary">
                    <section className="InputPane-campaigns">
                        <Msg tagName="h2" id="panes.input.summary.campaigns.h2"/>
                        { campaignContent }
                    </section>
                </div>
            );
        }
        else {
            let selectValue = this.state.viewMode + ':' + this.state.selectedId;

            content = [];

            if (this.state.viewMode == 'campaign') {
                let actionStore = this.props.actions;
                let targetId = target.get('id').toString();
                let targetActions = actionStore.getIn(['byTarget', targetId]);
                let responseList = targetActions.get('responseList');
                let userActionList = targetActions.get('userActionList');

                let campaign = this.props.campaigns
                    .getIn(['campaignList', 'items', this.state.selectedId.toString()]);

                // Filter list to only contain actions from the selected campaign
                let actionList = this.props.actions.get('actionList')
                    .updateIn(['items'], items => items
                        .filter(item =>
                            item.getIn(['campaign', 'id']) == campaign.get('id')));

                let scrollContainer = document
                    .querySelector('.InputPane .PaneBase-content');

                content.push(
                    <div key="campaignInfo" className="InputPane-campaignInfo">
                        <h2 key="h2">{ campaign.get('title') }</h2>
                        <p key="intro">
                            { campaign.get('info_text') }
                        </p>
                    </div>,
                    <CampaignForm key="campaignForm"
                        actionList={ actionList }
                        responseList={ responseList }
                        userActionList={ userActionList }
                        scrollContainer={ scrollContainer}
                        onResponse={ this.onCampaignResponse.bind(this) }/>
                );
            }
        }

        return content;
    }

    renderHeader() {
        let target = this.props.call.get('target');
        let step = this.props.step;
        let selectValue = this.state.viewMode + ':' + this.state.selectedId;

        if (this.state.viewMode != 'summary') {
            let campaignStore = this.props.campaigns;
            let campaignItems = campaignStore.getIn(['campaignList', 'items']);
            let campaignOptions = campaignItems.toList().map(campaign => {
                let value = 'campaign:' + campaign.get('id');

                return (
                    <option key={ value } value={ value }>
                        { campaign.get('title') }
                    </option>
                );
            });

            return (
                <div key="nav" className="InputPane-nav">
                    <FormattedLink className="InputPane-summaryLink"
                        msgId="panes.input.summaryLink"
                        onClick={ this.onSummaryLinkClick.bind(this) }/>
                    <Msg key="p" tagName="p"
                        id="panes.input.h1"
                        values={{ target: target.get('name') }}/>
                    <select value={ selectValue }
                        onChange={ this.onSelectChange.bind(this) }>
                        { campaignOptions }
                    </select>
                </div>
            );
        }
        else {
            let step = this.props.step;

            if (step === 'call') {
                return (
                    <Msg key="p" tagName="p"
                        id="panes.input.h1"
                        values={{ target: target.get('name') }}/>
                );
            }
            else {
                return (
                    <Msg tagName="p" id="panes.input.summaryLabel"/>
                );
            }
        }
    }

    onCampaignSelect(id) {
        this.setState({
            viewMode: 'campaign',
            selectedId: id,
        });
    }

    onCampaignResponse(action, checked) {
        this.props.dispatch(updateActionResponse(action, checked));
    }

    onRespondClick(type, id) {
        this.setState({
            viewMode: type,
            selectedId: id,
        });
    }

    onSummaryLinkClick(ev) {
        this.setState({
            viewMode: 'summary',
            selectedId: null,
        });
    }

    onSelectChange(ev) {
        let val = ev.target.value;
        let fields = val.split(':');

        this.setState({
            viewMode: fields[0],
            selectedId: fields[1],
        });
    }
}

const CampaignListItem = props => {
    let id = props.campaign.get('id');
    let title = props.campaign.get('title');
    let target = props.target.get('first_name');
    let numBookings = props.userActions.size;
    let numResponses = props.userResponses.size;

    let numActions = props.actions.size;
    let startDate = props.actions
        .sortBy(a => a.get('start_time'))
        .first()
        .get('start_time');

    let endDate = props.actions
        .sortBy(a => a.get('end_time'))
        .last()
        .get('end_time');

    let clickTarget =() => (props.isActive)
        ? props.onSelect(id)
        : null;

    return (
        <li onClick={ clickTarget }>
            <h3>{ title }</h3>
            <p className="InputPane-campaignListInfo">
                <FormattedDate value={ startDate }
                    day="numeric"
                    month="numeric"
                    />
                {" – "}
                <FormattedDate value={ endDate }
                    day="numeric"
                    month="numeric"
                    />
                <Msg id="panes.input.summary.campaigns.actions"
                    values={{count: numActions}} />

            </p>
            <p className="InputPane-campaignListStatus">
                <Msg id="panes.input.summary.campaigns.status"
                    values={{ target }}/>
                <Msg id="panes.input.summary.campaigns.bookings"
                    values={{ numBookings }}/>
                <Msg id="panes.input.summary.campaigns.responses"
                    values={{ numResponses }}/>
            </p>
            <FormattedLink key="CampaignListItemLink"
                className="InputPane-campaignListLink"
                msgId="panes.input.summary.campaigns.respondButton"
                msgValues={{ campaign: title }} />
        </li>
    );
};
