# TRAINING 4 PERFORMANCE

FOOTBALL PERFORMANCE OS

Integrated Football Fitness, Performance and Training Management Platform

Product Blueprint V2

1. PRODUCT PHILOSOPHY

The platform is designed around one rule:

MAKE THE COACH'S LIFE EASIER, NOT BUSIER.

The coach should not have to enter the same information in five different places.

The system should connect:

Player
Squad
Training
Drill
GPS
Fitness testing
Wellness
RPE
Medical status
Training availability
Training load
Match load
Performance analytics
Reports
AI recommendations

Everything belongs to the same player and the same team.

The coach enters the information once.

The platform does the rest.

2. THE SIMPLE USER JOURNEY

The entire platform should revolve around this sequence:

CREATE TEAM → CREATE SQUAD → ADD PLAYERS → TEST PLAYERS → PLAN TRAINING → RECORD PARTICIPATION → IMPORT GPS → ANALYSE → REPORT → ADJUST

That should be the normal daily workflow.

The coach should be able to understand the system without needing a manual.

3. HOME DASHBOARD

When the coach logs in, the first screen should answer five questions:

WHO DO I HAVE?

Squad size
Available players
Partial training
Individual training
Injured
Ill
Unavailable

WHAT DID WE DO?

Previous training sessions
Previous match
Recent workload

WHAT ARE WE DOING?

Today's session
Tomorrow's session
Weekly plan

HOW ARE THEY RESPONDING?

Wellness
RPE
GPS
Training load
Fitness trends

WHO NEEDS ATTENTION?

Players above workload thresholds
Players below expected exposure
Players with declining performance
Players with poor wellness
Players returning from injury

The dashboard should be visual, simple and colour coded.

4. TEAM CREATION

The first step is:

CREATE TEAM

The coach enters:

Team name
Club
Season
Competition
Age group
Gender
Head coach
Fitness coach
Performance staff

Example:

APOEL FC

First Team

Season 2026/27

The system then creates the team environment.

5. SQUAD CREATION

Inside the team:

CREATE SQUAD

Example:

First Team Squad

The squad contains all players.

Players can be added individually or through Excel/CSV.

6. PLAYER CREATION

Creating a player should be extremely fast.

Required:

First name
Last name
Date of birth
Position
Dominant leg

Optional:

Player photo
Nationality
Squad number
Height
Weight
Body fat
Muscle mass

The system automatically calculates:

Age
BMI
Age group

The player receives a unique internal ID.

7. PLAYER PROFILE

Every player has one central profile.

Think of this as the player's:

Digital Performance Passport

The profile contains tabs.

PROFILE

Personal information

FITNESS

All fitness testing

GPS

Training and match load

WELLNESS

Daily readiness

TRAINING

Training participation

MEDICAL

Injury and availability history

ANALYTICS

Performance trends

REPORTS

Individual reports

Everything relates back to this player.

8. PLAYER FITNESS BASELINE

At the beginning of the season, the coach can run a complete testing battery.

Example:

Height
Weight
Body composition
CMJ
Squat Jump
RSI
10 m sprint
20 m sprint
30 m sprint
Maximum speed
505
Yo-Yo
30-15 IFT
MAS
RSA
Nordic strength
Other strength tests

The coach enters the results once.

The system automatically establishes:

Baseline
Personal best
Team average
Position average
Historical trend

9. TESTING HISTORY

Every subsequent test is added to the player's history.

Example:

August

CMJ 39 cm

October

CMJ 41 cm

January

CMJ 37 cm

The graph automatically shows the trend.

The coach does not need to create the graph.

The system does it.

10. TRAINING CALENDAR

The calendar is the centre of daily coaching.

The coach selects:

Date

Team

Training session

Then selects participating players.

For example:

18 players full training

2 players individual

2 players rehabilitation

1 player unavailable

This information is immediately connected to the player's profile.

11. TRAINING PARTICIPATION

Every training session records player participation.

Status options:

Full Training

Partial Training

Individual Training

Rehabilitation

Modified Training

Did Not Train

Injured

Ill

Other

This becomes part of the player's historical training record.

The coach can later answer:

"How much training has Player A missed this season?"

Without manually calculating it.

12. SESSION DESIGNER

The coach creates the training session.

Example:

SESSION

MD-3

Duration: 80 minutes

Objective:

High intensity + aerobic conditioning

The coach then adds drills.

13. DRILL SELECTION

Every drill has predefined characteristics.

For example:

DRILL

4v4 + 2 Neutral Players

Focus:

Aerobic

Anaerobic

Technical

Decision Making

Conditioning

Intensity:

High

Estimated RPE:

7/10

Duration:

4 × 4 minutes

Recovery:

2 minutes

Area:

30 × 25 m

Players:

12

The coach can modify anything.

14. TRAINING FOCUS CATEGORIES

Each drill can have one or multiple categories.

PHYSICAL

Strength

Power

Speed

Acceleration

Maximum Speed

Endurance

Aerobic

Anaerobic

Repeated Sprint Ability

Change of Direction

Agility

Coordination

Mobility

Stability

Core

Injury Prevention

Recovery

FOOTBALL

Technical

Passing

Receiving

Finishing

Dribbling

Possession

Rondo

Small-Sided Game

Tactical

Transition

Pressing

Defending

Attacking

Decision Making

The coach can filter the drill library using these categories.

15. ESTIMATED RPE

Every drill can have an estimated RPE.

Example:

Warm-up

RPE 2

Speed

RPE 7

SSG

RPE 8

Cool-down

RPE 1

The system calculates a planned session intensity.

After training, the actual session RPE can be entered.

Therefore:

PLANNED

RPE 7

ACTUAL

RPE 8

The system records the difference.

16. THE INTERACTIVE FIELD

The session designer contains the interactive football field.

The coach chooses:

Full pitch

Half pitch

Quarter pitch

Custom area

Small-sided field

Custom dimensions

The field can rotate:

Horizontal

Vertical

Landscape

Portrait

17. EQUIPMENT

The coach drags equipment onto the field.

Cones
Balls
Goals
Mini goals
Poles
Hurdles
Ladders
Mannequins
Markers
Resistance equipment
Speed gates
Other equipment

The coach should not need to draw equipment manually.

18. MOVEMENT DESIGN

The coach can draw:

Player movement

Sprint

Pass

Dribble

Change of direction

Rotation

Press

Defensive movement

Ball movement

The coach can use:

Arrows

Curved arrows

Dashed lines

Different colours

Different line thickness

19. MEASUREMENT

The coach can define distances directly on the pitch.

Example:

Sprint

25 metres

5 repetitions

The system records:

Total sprint distance

125 m

This information becomes part of the planned session.

20. SESSION LOAD PRESCRIPTION

Every drill can contain:

Duration

Sets

Repetitions

Distance

Intensity

RPE

Work/rest ratio

Number of players

Physical focus

The system creates a planned workload profile.

21. PLANNED SESSION

The coach finishes the session.

The platform automatically creates:

Session duration

Planned RPE

Physical focus

Planned running volume

Planned sprint volume

Planned high-speed exposure

Estimated load

The coach can export the session.

22. GPS IMPORT

After training, the coach imports GPS data.

Supported:

Excel

CSV

Future direct API integration

The most important requirement is:

PLAYER MATCHING MUST BE AUTOMATIC.

23. PLAYER NAME MATCHING

The player database contains:

First Name
Last Name
Unique Player ID

GPS data contains:

First Name
Last Name

The system matches the GPS player to the existing player.

Example:

Database:

JOHN SMITH

GPS:

JOHN SMITH

Automatic match.

The coach should see:

18 matched

1 unmatched

The system should never silently create a duplicate player.

24. SMART IMPORT

If the GPS provider uses:

Smith, John

while the database contains:

John Smith

the system should be able to identify the likely match.

If confidence is high:

Automatic match.

If confidence is uncertain:

Ask the coach to confirm.

Example:

"Did John Smith correspond to J. Smith?"

Yes / No

Once confirmed, the system remembers the relationship.

25. GPS DATA

The platform should support:

Duration

Total distance

HSR

Sprint distance

Maximum speed

Accelerations

Decelerations

PlayerLoad

Metabolic power

Heart rate where available

Other provider-specific metrics

26. GPS NORMALIZATION

Different providers use different terminology.

The system converts them into standardized categories.

For example:

Provider A:

High Speed Running

Provider B:

HSR Distance

Provider C:

High Velocity Running

Internally:

HSR

This makes the analytics consistent.

27. AUTOMATIC POST-TRAINING ANALYSIS

After GPS import:

The system automatically updates:

Player load

Squad load

Distance

HSR

Sprint distance

Max speed

Acceleration load

Deceleration load

Session duration

Weekly load

Rolling load

Acute load

Chronic load

Training exposure

Match exposure

The coach should not calculate these manually.

28. ACUTE LOAD

The system calculates acute workload using the configured methodology.

Default:

7-day load

But the coach can change the window.

29. CHRONIC LOAD

The platform can calculate chronic workload using a configurable historical window.

For example:

28 days

If a full 28-day history does not exist, the system should clearly state:

Insufficient historical data for a reliable 28-day comparison.

It should never pretend that missing data is complete data.

30. ACUTE:CHRONIC LOAD

The platform calculates the selected ACWR methodology.

Example:

Acute load:

420

Chronic load:

350

Ratio:

1.20

The system displays:

Current workload

Historical workload

Ratio

Trend

Threshold status

But the system should clearly treat ACWR as a monitoring metric, not a magic injury predictor.

31. WORKLOAD DASHBOARD

For each player:

Total distance

HSR

Sprint

Acceleration

Deceleration

Max speed

RPE

Session-RPE

Acute load

Chronic load

ACWR

Training monotony

Training strain

The coach chooses which metrics are displayed.

32. SQUAD PERFORMANCE

The squad dashboard automatically calculates:

Team average

Median

Minimum

Maximum

Standard deviation

Position average

Individual deviation from team average

Example:

HSR

Squad average:

620 m

Player A:

840 m

Difference:

+220 m

The system highlights Player A.

33. PLAYER DEVIATION

The system should identify significant differences from the team.

Example:

Player A

HSR:

840 m

Team average:

620 m

Player is:

35.5 percent above team average.

The coach immediately sees it.

34. POSITION ANALYSIS

The same analysis can be performed by position.

Example:

Wingers

Average HSR:

780 m

Player A:

920 m

Central Midfielders

Average HSR:

610 m

Player B:

640 m

This is more useful than comparing every player against one global average.

35. PERFORMANCE TRENDS

The coach can choose:

7 days

14 days

28 days

1 month

2 months

3 months

6 months

Season

Custom period

The graph updates automatically.

36. HISTORICAL COMPARISON

The coach can ask:

"What did we do one month ago?"

"What was our average HSR two months ago?"

"Compare September with November."

"Compare this month with last month."

"Compare this season with last season."

The system generates the comparison automatically.

37. PLAYER COMPARISON

Select two or more players.

Example:

Player A

Player B

Player C

Compare:

Distance

HSR

Sprint

Max speed

RPE

ACWR

CMJ

10 m sprint

Wellness

Availability

The system displays the data side by side.

38. PERIOD COMPARISON

The coach selects:

Period A

August 1–31

Period B

September 1–30

The system compares:

Training volume

Intensity

HSR

Sprint

Max speed

RPE

Injury availability

Wellness

Fitness testing

39. MEDICAL AND TRAINING HISTORY

This must be a dedicated player tab.

MEDICAL

Injury history

Illness

Body area

Injury date

Return date

Days lost

Notes

TRAINING STATUS

Full training

Partial training

Individual training

Rehabilitation

Modified

No training

This creates a complete availability history.

40. TRAINING LOST

The system automatically calculates:

Total sessions available

Sessions completed

Sessions partially completed

Individual sessions

Sessions missed

Percentage availability

Training days lost

Example:

Season:

120 training sessions

Full:

104

Partial:

8

Individual:

4

Missed:

4

Availability:

96.7 percent

41. INJURY TIMELINE

The player profile can show:

Injury

↓

Rehabilitation

↓

Individual training

↓

Partial team training

↓

Full training

↓

Match available

This creates a visual RTP timeline.

42. FITNESS COACH VIEW

The fitness coach should be able to answer immediately:

Who trained fully today?

Who trained partially?

Who did individual work?

Who is injured?

Who is returning?

Who missed training?

How much load did each player receive?

Who is above the team average?

Who is below the team average?

Who has poor wellness?

Who has insufficient sprint exposure?

Who has high workload?

The system should answer these without spreadsheet calculations.

43. AI PERFORMANCE ASSISTANT

AI should be built into the platform.

The AI does not replace the coach.

It analyses the information already stored in the platform.

44. AI DAILY SUMMARY

At the end of training:

AI PERFORMANCE SUMMARY

Team workload increased 8 percent compared with the previous training day.

Three players exceeded the squad average for HSR.

Two players had unusually high sprint exposure compared with their recent four-week history.

Four players reported elevated fatigue.

Player A completed only 60 percent of the planned session.

Player B has had reduced high-speed exposure over the last 14 days.

The coach can click each statement for the underlying data.

45. AI PLAYER ANALYSIS

Ask:

"How is Player A progressing?"

The AI can summarize:

Fitness testing trend

GPS trend

Wellness

RPE

Availability

Training load

High-speed exposure

Sprint exposure

Recent injuries

Compared with historical baseline

46. AI TEAM ANALYSIS

Ask:

"How is the team progressing over the last six weeks?"

The AI analyses:

Training volume

Training intensity

Match load

HSR

Sprint exposure

Wellness

Fitness testing

Availability

Injury trends

The output should contain actual numbers and graphs.

47. AI ALERTS

The AI can identify unusual patterns.

For example:

"Player A's current seven-day workload is substantially higher than his recent baseline."

"Player B's maximum-speed exposure has been low for three consecutive weeks."

"Player C's CMJ has decreased 9 percent from his personal baseline."

"Player D has accumulated multiple partial training sessions during the last two weeks."

These are observations.

The AI should distinguish observations from recommendations.

48. AI RECOMMENDATIONS

The AI can provide:

Possible considerations

Suggested monitoring

Potential session modifications

Questions for the performance staff

It should not make medical diagnoses.

Example:

"Consider reviewing Player A's workload before assigning additional high-intensity running."

The coach remains responsible for the decision.

49. AUTOMATIC GRAPHICS

Every important metric should automatically become a graph.

Examples:

Distance trend

HSR trend

Sprint trend

Maximum speed trend

ACWR trend

RPE trend

Wellness trend

CMJ trend

Bodyweight trend

Availability trend

Injury trend

50. PROFESSIONAL REPORTING

The platform should produce presentation-ready reports.

TEAM REPORT

Squad statistics

Training load

GPS metrics

Fitness testing

Availability

Injury statistics

Wellness

Key observations

Graphs

PLAYER REPORT

Individual testing

GPS

Workload

Wellness

Availability

Progress

Comparison

Graphs

51. REPORT AUDIENCE

The coach can select:

Fitness staff report

Head coach report

Technical director report

Club management report

Player report

Each version displays appropriate information.

Medical information should not automatically appear in reports intended for non-medical users.

52. ONE-CLICK REPORT

The coach selects:

Team

Period

Report type

Click:

GENERATE REPORT

The platform creates the report automatically.

No copying data into PowerPoint.

No Excel manipulation.

No manual graphs.

53. EXPORT

Everything important should be exportable.

PDF

Excel

CSV

PNG

Charts

Session diagrams

Reports

Player data

Testing data

GPS summaries

54. THE CONNECTION BETWEEN EVERYTHING

This is the most important architectural principle.

A player is connected to:

Their team

Their squad

Their training sessions

Their drills

Their GPS

Their RPE

Their wellness

Their fitness tests

Their medical history

Their availability

Their workload

Their reports

Their historical data

Therefore:

One player record → everything connected.

55. THE SAME PRINCIPLE APPLIES TO TRAINING

One training session connects to:

Date

Team

Squad

Players

Drills

Training focus

Duration

Planned RPE

Actual RPE

GPS data

Training load

Wellness

Match-day position

Coach notes

Reports

Therefore:

One session → everything connected.

56. THE COMPLETE DATA FLOW

STEP 1

Create Team.

↓

STEP 2

Create Squad.

↓

STEP 3

Add Players.

↓

STEP 4

Enter Baseline Testing.

↓

STEP 5

Create Training Session.

↓

STEP 6

Select Players.

↓

STEP 7

Build Drills.

↓

STEP 8

Assign Training Focus.

↓

STEP 9

Set Duration / RPE / Workload.

↓

STEP 10

Complete Training.

↓

STEP 11

Enter Actual RPE.

↓

STEP 12

Import GPS.

↓

STEP 13

Automatic Player Matching.

↓

STEP 14

Automatic Load Calculation.

↓

STEP 15

Automatic Analytics.

↓

STEP 16

AI Analysis.

↓

STEP 17

Automatic Report.

↓

STEP 18

Coach Adjusts Next Session.

57. THE GOLDEN RULE

The coach should never have to enter the same information twice.

For example:

If the coach selects Player A for today's session, the system already knows that Player A participated.

If GPS is subsequently imported, the GPS automatically attaches to today's session and Player A.

If RPE is entered, it attaches to the same session.

If the player was partial training, that information attaches to the session.

Everything flows into the player's historical record automatically.

58. WHAT THE COACH SHOULD SEE

The interface should be clean.

Large buttons.

Clear terminology.

Minimal forms.

Drag and drop where possible.

Graphs instead of tables where appropriate.

Tables when precise numbers matter.

Colour-coded status.

One-click exports.

Mobile-friendly design.

The system should feel like a professional coaching tool, not an accounting application.

59. WHAT WE SHOULD NOT DO

Do not create unnecessary data-entry screens.

Do not force the coach to enter information that can be calculated automatically.

Do not bury important information inside menus.

Do not make the coach manually build graphs.

Do not require duplicate player creation.

Do not make the coach manually calculate workload.

Do not make the coach manually compare players.

Do not make the coach manually prepare weekly reports.

Do not overwhelm the dashboard with 50 metrics.

The platform should show the important information first and allow deeper analysis when required.

60. THE PRODUCT IN ONE SENTENCE

A football performance platform where the coach creates the squad, plans the training, monitors the players, imports the GPS, tracks medical and training availability, analyses workload and performance, and receives automatic analytics and AI-supported insights, all from one connected system.

61. THE REAL PRODUCT ADVANTAGE

The tactical board is valuable.

The GPS analysis is valuable.

The testing system is valuable.

The medical history is valuable.

The reporting is valuable.

But individually, competitors can build each one.

The real advantage is:

Everything is connected.

The session you design influences the workload you expect.

The workload you expect is compared with the workload the player actually receives.

The actual workload is compared with his history.

His history is connected to his fitness testing.

His fitness testing is connected to his position and squad.

His workload is connected to wellness and availability.

Everything becomes part of one performance picture.

And the AI sits on top of that entire database.

That is the product we should build.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://connect-play-perform.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4fe0bb96-d006-4892-8a5c-71fc99157d14).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
