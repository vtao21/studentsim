"use strict";
//name, hours, healthInc, GPAInc, funInc, healthReq, GPAReq, funReq
const clubs = {
	"none": new Club("none", 0, 0, 0, 0, 0, 0, 0),
	"Soccer Team": new Club("Soccer Team", 2, 20, 0, 20, 70, 2.0, 0),
	"Quiz Bowl": new Club("Quiz Bowl", 2, 0, 3, 10, 0, 3.5, 0),
	"Comedy Club": new Club("Comedy Club", 2, 0, 0, 40, 0, 2.0, 70),
}
//have events for a club
/* EVENT
name, type, text, healthInc, funInc, GPAInc, 
USER INPUT EVENT
name, text, healthInc, funInc, academicsInc, maxHours, healthDec, funDec, academicsDec,
inc = if yes dec = if no
*/

//popQuiz, hangout, bullies, substitute, slept through alarm, pizza for lunch, meme
const events = {
	none: new Event("none", "normal", "", 0, 0, 0),
	popQuiz: new Event("popQuiz", "normal", "You had a pop quiz today", 0, 0, 0),
	pizzaLunch: new Event("pizzaLunch", "normal", "You had pizza for lunch", 10, 10, 0),
	meme: new Event("meme", "normal", "Your friend showed you a funny meme", 0, 20, 0),
	mall: new InputFormEvent("mall", "Your friends want to hang out at the mall with you", 0, 15, 0, 4, 0, 20, 0),


}

const eventPool = [events.mall, events.popQuiz, events.pizzaLunch, events.meme];

class PlayerState extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			displayStartScreen:true,
			displayStats: false,
			displayChooseActivity: false,
			displayEndScreen: false,
			displayHoursForm: false,
			displayChooseClub: false,
			displayEventBox: false,
			messageType: "",
			hoursFormActivity: "",
			numClasses: 4,
			day: 1,
			lastDay: 14,
			startTime: 15,
			wakeUpTime: 6,
			time: 15,
			timeInc: 0,
			// name, currentPoints, totalPoints, inputHolder, defaultActivityValue, dailyActivityInc, dailyEventInc, dailyDec
			academics: new Stat("academics", 0, 0, 0, 10, 0, 0, 0),
			fun: new Stat("fun", 50, 0, 0, 10, 0, 0, 10),
			health: new Stat("health", 50, 0, 0, 10, 0, 0, 10),
			GPA: 0.0,
			sleepValue: 10,
			club: clubs.none,
			event: events.none,
			eventHours: 0,
			eventProb: 0.3,
			necessarySleepHours: 8,
		}
		this.handleStart = this.handleStart.bind(this);
		this.handleClassChange = this.handleClassChange.bind(this);
		this.handleActivityClick = this.handleActivityClick.bind(this);
		this.handleHoursChange = this.handleHoursChange.bind(this);
		this.calculateMaxHours = this.calculateMaxHours.bind(this);
		this.handleHoursSubmit = this.handleHoursSubmit.bind(this);
		this.handleJoinClubClick = this.handleJoinClubClick.bind(this);
		this.handleChooseClubClick = this.handleChooseClubClick.bind(this);
		this.handleLeaveClubClick = this.handleLeaveClubClick.bind(this);
		this.handleConfirmLeaveClubClick = this.handleConfirmLeaveClubClick.bind(this);
		this.handleEventHoursChange = this.handleEventHoursChange.bind(this);
		this.handleEventFormSubmit = this.handleEventFormSubmit.bind(this);
		this.chooseEvent = this.chooseEvent.bind(this);
		this.updateCurrent = this.updateCurrent.bind(this);
		this.updateValues = this.updateValues.bind(this);
		this.updateDecay = this.updateDecay.bind(this);
		this.calculateSleepDecay = this.calculateSleepDecay.bind(this);
		this.calculateGPA = this.calculateGPA.bind(this);
		this.nextDay = this.nextDay.bind(this);
	}

	handleStart() {
		this.setState({displayStartScreen: false, displayStats: true, displayChooseActivity: true,});
	}

	handleClassChange(e) {
		this.setState({numClasses:parseInt(e.target.value)});
	}

	handleClassSubmit(e) {
		e.preventDefault();
	}

	handleActivityClick(e) {
		e.preventDefault();
		this.setState({displayHoursForm: true, displayChooseActivity: false, displayEventBox: false, messageType: "", hoursFormActivity: e.target.name});
	}

	handleHoursChange(e) {
		e.preventDefault();
		if (e.target.value) {
			this.setState({timeInc: parseInt(e.target.value)});
			if (this.state.hoursFormActivity == "exercise") {
				this.state.health.inputHolder = parseInt(e.target.value);
			} else if (this.state.hoursFormActivity == "study") {
				this.state.academics.inputHolder = parseInt(e.target.value);
			} else if (this.state.hoursFormActivity == "playGames") {
				this.state.fun.inputHolder = parseInt(e.target.value);
			}
		} else {
			this.setState({timeInc: 0,});
			[this.state.health.inputHolder, this.state.academics.inputHolder, this.state.fun.inputHolder] = [0, 0, 0];
		}
	}

	calculateMaxHours() {
		if (this.state.time > this.state.wakeUpTime) {
			return 24 - this.state.time + this.state.wakeUpTime;
		} else {
			return this.state.wakeUpTime - this.state.time;
		}
	}

	handleHoursSubmit(e) {
		e.preventDefault();
		let currentTime = this.state.time + parseInt(this.state.timeInc);
		currentTime = currentTime < 24 ? currentTime : currentTime-24;
		if (this.state.hoursFormActivity == "exercise") {
			this.state.health.dailyActivityInc += this.state.health.inputHolder;
		} else if (this.state.hoursFormActivity == "study") {
			this.state.academics.dailyActivityInc += this.state.academics.inputHolder;
		} else if (this.state.hoursFormActivity == "playGames") {
			this.state.fun.dailyActivityInc += this.state.fun.inputHolder;
		}
		this.setState({displayHoursForm: false, displayChooseActivity: true, time: currentTime, timeInc: 0});
		[this.state.health.inputHolder, this.state.academics.inputHolder, this.state.fun.inputHolder] = [0, 0, 0];
	}

	handleJoinClubClick() {
		this.setState({displayChooseClub: true, displayChooseActivity: false, displayEventBox: false, messageType: ""});
	}

	handleChooseClubClick(e) {
		if (clubs[e.target.name].isEligible(this.state.health.current, this.state.GPA, this.state.fun.current)) {
			this.setState({club: clubs[e.target.name]});
		} else {
			this.setState({messageType: "warning"});
		}
		this.setState({displayChooseClub: false, displayChooseActivity: true,});
	}

	handleLeaveClubClick() {
		this.setState({displayChooseActivity: false, displayEventBox: false, messageType: "danger"});
	}

	handleConfirmLeaveClubClick() {
		delete clubs[this.state.club.name];
		this.setState({displayChooseActivity: true, messageType: "", club: clubs.none, });
	}

	handleEventHoursChange(e) {
		e.preventDefault();
		if (e.target.value) {
			[this.state.health.inputHolder, this.state.fun.inputHolder, this.state.academics.inputHolder] = [parseInt(e.target.value), parseInt(e.target.value), parseInt(e.target.value)];
		} else {
			[this.state.health.inputHolder, this.state.fun.inputHolder, this.state.academics.inputHolder] = [0, 0, 0];
		}
	}

	handleEventFormSubmit(e) {
		e.preventDefault();
		this.state.health.inputHolder == 0 ? this.state.health.dailyEventInc -= this.state.event.healthDec : this.state.health.dailyEventInc += this.state.health.inputHolder * this.state.event.healthInc;
		this.state.fun.inputHolder == 0 ? this.state.fun.dailyEventInc -= this.state.event.funDec : this.state.fun.dailyEventInc += this.state.fun.inputHolder * this.state.event.funInc;
		this.state.academics.inputHolder == 0 ? this.state.academics.dailyEventInc -= this.state.event.academicsDec : this.state.academics.dailyEventInc += this.state.academics.inputHolder * this.state.event.academicsInc;
		this.setState((state) => ({
			displayChooseActivity: true,
			displayEventBox: false,
			time: state.time + state.health.inputHolder,
		}))
	}

	chooseEvent() {
		if (Math.random() <= this.state.eventProb) {
			let event = eventPool[Math.floor(Math.random() * eventPool.length)];
			this.setState({displayEventBox: true, event: event});
			if (event.type == "inputForm") this.setState({displayChooseActivity: false});
			if (event.type != "inputForm") {
				this.state.health.current += event.healthInc;
				this.state.academics.current += event.academicsInc;
				this.state.fun.current += event.funInc;
			}
		} else {
			this.setState({displayEventBox: false, event: events.none});
		}
	}

	boundStats(stat) {
		if (stat <= 100 && stat >= 0) {
			return stat;
		} else {
			return stat > 100 ? 100 : 0;
		}
	}

	updateCurrent() {
		this.state.health.current = this.boundStats(this.state.health.current + this.state.health.dailyActivityInc * this.state.health.activityValue - this.state.health.dailyDec - this.calculateSleepDecay() + this.state.club.healthInc + this.state.health.dailyEventInc);
		this.state.fun.current = this.boundStats(this.state.fun.current + this.state.fun.dailyActivityInc * this.state.fun.activityValue + this.state.club.funInc - this.state.fun.dailyDec + this.state.fun.dailyEventInc);
		let multiplier = 0.17071 * Math.sqrt(this.state.health.current) - 1.20711;
		let dailyAcademicsInc = (this.state.academics.dailyActivityInc + this.state.club.academicsInc)/this.state.numClasses;
		dailyAcademicsInc += multiplier * dailyAcademicsInc;
		this.state.academics.current = this.boundStats(Math.round(100 * dailyAcademicsInc));
		this.state.academics.total += this.state.academics.current;
	}

	updateValues() {
		//square root function that is 0 at x = 50 and 0.5 at x = 100
		let multiplier = 0.17071 * Math.sqrt(this.state.health.current) - 1.20711;
		this.state.fun.activityValue = Math.round(this.state.fun.defaultActivityValue + this.state.fun.defaultActivityValue * multiplier);
		this.state.academics.activityValue = Math.round(this.state.academics.defaultActivityValue + this.state.academics.defaultActivityValue * multiplier);		
		if (this.state.fun.activityValue < 0 ) this.state.fun.activityValue = 0;

	}

	updateDecay() {
		if (this.state.health.current < 50) {
			//upside down square root function that is 2 at x = 0 and 0 at x = 50
			let multiplier = -0.28284 * Math.sqrt(this.state.health.current) + 2;
			this.state.fun.dailyDec = Math.round(this.state.fun.defaultDailyDec + this.state.fun.defaultDailyDec * multiplier);
			this.state.health.dailyDec = Math.round(this.state.health.defaultDailyDec + this.state.health.defaultDailyDec * multiplier);
		}
	}

	calculateSleepDecay() {
		let sleepDecay = 0;
		if (this.state.time < this.state.wakeUpTime && (this.state.wakeUpTime - this.state.time) < this.state.necessarySleepHours) {
			sleepDecay = this.state.sleepValue*(this.state.necessarySleepHours-(this.state.wakeUpTime - this.state.time));
		} else if (this.state.time > this.state.wakeUpTime && ((24 - this.state.time + this.state.wakeUpTime) < this.state.necessarySleepHours)) {
			sleepDecay = this.state.sleepValue*(this.state.necessarySleepHours-(24 - this.state.time + this.state.wakeUpTime));
		}
		return sleepDecay >= 0 ? sleepDecay : 0;
	}

	calculateGPA() {
		let GPA  = Math.round(100*((this.state.academics.total/this.state.day)/20 - 1))/100;
		if (this.state.numClasses == 5){
			GPA += 0.5;
		} else if (this.state.numClasses == 6){
			GPA += 1;
		}
		return GPA >= 0 ? GPA : 0;
	}

	nextDay(e) {
		e.preventDefault();
		if (this.state.day == this.state.lastDay) {
			this.setState({displayChooseActivity: false, displayStats: false, displayEventBox: false, displayEndScreen: true});
		} else {
			this.updateCurrent();
			this.updateValues();
			this.updateDecay();
			[this.state.fun.dailyActivityInc, this.state.health.dailyActivityInc, this.state.academics.dailyActivityInc] = [0, 0, 0];
			[this.state.fun.dailyEventInc, this.state.health.dailyEventInc, this.state.academics.dailyEventInc] = [0, 0, 0];
			[this.state.fun.inputHolder, this.state.health.inputHolder, this.state.academics.inputHolder] = [0, 0, 0];
			this.setState((state) => ({
				messageType: "",
				day: state.day + 1,
				time: state.club.name == "none" ? state.startTime : state.startTime + state.club.hours,
				GPA: this.calculateGPA(),
			}));
			this.chooseEvent();
			if (!this.state.club.isEligible(this.state.health.current, this.state.GPA, this.state.fun.current)) {
				this.setState({ messageType: "warning", club: clubs.none, });
			}
		}
	}

	render() {
		return (
			<div>
				<StartScreen displayStartScreen={this.state.displayStartScreen} onStart={this.handleStart} onClassSubmit={this.handleClassSubmit} onClassChange={this.handleClassChange}/>
				<Message type={this.state.messageType} onConfirmLeaveClubClick={this.handleConfirmLeaveClubClick}></Message>
				<ChooseActivity displayChooseActivity={this.state.displayChooseActivity} onActivityClick={this.handleActivityClick} club={this.state.club} onJoinClubClick={this.handleJoinClubClick} onLeaveClubClick={this.handleLeaveClubClick} nextDay={this.nextDay} time={this.state.time} startTime={this.state.startTime + this.state.club.hours
				}/>
				<ChooseClub displayChooseClub={this.state.displayChooseClub} onChooseClubClick={this.handleChooseClubClick}/>
				<HoursForm displayHoursForm={this.state.displayHoursForm} hoursFormActivity={this.state.hoursFormActivity} onHoursSubmit={this.handleHoursSubmit} onHoursChange={this.handleHoursChange} calculateMaxHours={this.calculateMaxHours}/>
				<EventBox displayEventBox={this.state.displayEventBox} eventType={this.state.event.type} eventText={this.state.event.text} onEventHoursChange={this.handleEventHoursChange} onEventFormSubmit={this.handleEventFormSubmit} maxHours={this.state.event.maxHours}/>
				<DisplayStats displayStats={this.state.displayStats} day={this.state.day} time={this.state.time} clubName={this.state.club.name} health={this.state.health.current} GPA={this.state.GPA} fun={this.state.fun.current}/>
				<EndScreen displayEndScreen={this.state.displayEndScreen} health={this.state.health.current} GPA={this.state.GPA} fun={this.state.fun.current}/>
			</div>

		);
	}
}

class StartScreen extends React.Component {
	constructor(props) {
		super(props);
		this.handleStart = this.handleStart.bind(this);
	}

	handleStart(e) {
		this.props.onStart();
		this.props.onClassSubmit(e);
	}

	render() {
		if (this.props.displayStartScreen) {
			return (
				<div>
					<h1>The Funnest Bestest Game Ever</h1>
					<h3>How many classes will you be taking</h3>
					<form onSubmit={this.handleStart} onChange={this.props.onClassChange}>
						<div>
							<input type="radio" name="numClasses" value="4" defaultChecked/>
							<label htmlFor="4">4</label>
							<input type="radio" name="numClasses" value="5"/>
							<label htmlFor="5">5</label>
							<input type="radio" name="numClasses" value="6"/>
							<label htmlFor="6">6</label>
						</div>
						<div>
							<button>Start</button>
						</div>
					</form>
				</div>
			)
		} else {
			return null;
		}
	}
}

class ClubButton extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		if (this.props.time == this.props.startTime) {
			if (this.props.club == clubs.none) {
				return (
					<button onClick={this.props.onJoinClubClick}>Join Club</button>
				);
			} else {
				return (
					<button onClick={this.props.onLeaveClubClick}>Leave Club</button>
				);
			}
		} else {
			return null;
		}
	}
}

class ChooseActivity extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		if (this.props.displayChooseActivity) {
			return (
				<div>
					<h2>What do you want to do?</h2>
					<input onClick={this.props.onActivityClick} type="button" name="exercise" value="Exercise"/>
					<input onClick={this.props.onActivityClick} type="button" name="study" value="Study"/>
					<input onClick={this.props.onActivityClick} type="button" name="playGames" value="Play Videogames"/>
					<ClubButton club={this.props.club} onJoinClubClick={this.props.onJoinClubClick} onLeaveClubClick={this.props.onLeaveClubClick} time={this.props.time} startTime={this.props.startTime}/>
					<button onClick={this.props.nextDay}>Sleep</button>
				</div>
			)
		} else {
			return null;
		}
	}
}

class ChooseClub extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const buttons = Object.keys(clubs).map((club, i) => {
			if (club != "none") {
				return <button key={i} onClick={this.props.onChooseClubClick} name={club}>{clubs[club].name}</button>
			}
		})
		if (this.props.displayChooseClub) {
			return (
				<div>
					<h2>What club do you want to try out for?</h2>
					{buttons}
				</div>
			)
		} else {
			return null;
		}
	}
}

class HoursForm extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		if (this.props.displayHoursForm) {
			let maxHours = this.props.calculateMaxHours();
			return (
				<div>
					<h3>How many hours do you want to spend?</h3>
					<form onSubmit={this.props.onHoursSubmit}>
						<input step="1" min="0" max={maxHours} type="number" onChange={this.props.onHoursChange} name={this.props.hoursFormActivity}/>
						<button>Submit</button>
					</form>
				</div>
			)
		} else {
			return null;
		}
	}
}

class Message extends React.Component {
	constructor(props) {
		super(props);
		this.messages = {
			"warning": <WarningMessage></WarningMessage>,
			"danger": <DangerMessage onConfirmLeaveClubClick={this.props.onConfirmLeaveClubClick}></DangerMessage>
		}
	}

	render() {
		if (this.props.type in this.messages) {
			return this.messages[this.props.type];
		} else {
			return null;
		}
	}
}

//the names of these classes are based off of the bootstrap colors

class WarningMessage extends React.Component {
	render() {
		return (
			<div>
				<h4>You did not meet the requirements for this club</h4>
			</div>
		)

	}
}

class DangerMessage extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				<h1>ARE YOU SURE YOU WANT TO LEAVE THIS CLUB?</h1>
				<h1>IF YOU LEAVE THE CLUB YOU CANNOT REJOIN BECAUSE YOUR CLUB MEMBERS NEED COMMITMENT</h1>
				<button onClick={this.props.onConfirmLeaveClubClick}>I am sure I want to leave the club</button>
			</div>
		)
	}
}

class EventBox extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		if (this.props.displayEventBox) {
			if (this.props.eventType == "inputForm") {
				return (
					<InputFormEventDisplay eventText={this.props.eventText} onEventHoursChange={this.props.onEventHoursChange} onEventFormSubmit={this.props.onEventFormSubmit} maxHours={this.props.maxHours}/>
				)
			} else {
				return (
					<div>
						<h4>{this.props.eventText}</h4>
					</div>
				)
			}
		} else {
			return null;
		}
	}
}

class InputFormEventDisplay extends React.Component {
	constructor(props) {
		super(props);
	}

	render(){
		return (
			<div>
				<form onSubmit={this.props.onEventFormSubmit}>
					<div>
						<h3>{this.props.eventText}</h3>
						<h5>How many hours will you spend?</h5>
						<input step="1" type="number" min="0" max={this.props.maxHours} name="eventInc" onChange={this.props.onEventHoursChange}/>
						<button>Submit</button>
					</div>
				</form>
			</div>
		)
	}
}

class DisplayStats extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		if (this.props.displayStats) {
			let timeDisplay;
			if (this.props.time == 0) {
				timeDisplay = "12 AM";
			} else if (this.props.time == 12) {
				timeDisplay = "12 PM";
			} else if (this.props.time < 12) {
				timeDisplay = this.props.time + " AM"
			} else {
				timeDisplay = this.props.time%12 + " PM"
			}
			return (
				<div>
					<h1>GAME STATE</h1>
					<h2>DAY {this.props.day} TIME {timeDisplay}</h2>
					<h3>CLUB: {this.props.clubName}</h3>
					<h3>HEALTH: {this.props.health}</h3>
					<h3>GPA: {this.props.GPA}</h3>
					<h3>FUN: {this.props.fun}</h3>
				</div>
			)
		} else {
			return null;
		}
	}
}

class EndScreen extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		if (this.props.displayEndScreen) {
			return (
				<div>
					<h1>HIGH SCHOOL IS OVER</h1>
					<h2>Your Health: {this.props.health}</h2>
					<h2>Your GPA: {this.props.GPA}</h2>
					<h2>Your Fun: {this.props.fun}</h2>
				</div>
			)
		} else {
			return null;
		}
	}
}

let display = document.querySelector("#display");
ReactDOM.render(<PlayerState />, display);
