export const TOXICITY_DEFINITION =
  "A text is considered as toxic in open-source communication, if it includes any of the following: identity attacks/name-calling, insults, vulgarity, flirtations, reference to sexual activities, threats, entitlement, arrogance, bitter frustration, mocking, impatience or irony. A text that does not fit this definition would be marked as non-toxic.";

export const TOXICITY_TYPES = {
  IdentityAttackNameCalling: "identity attack/name-calling",
  Insult: "insult",
  Vulgarity: "vulgarity",
  Flirtation: "flirtation",
  ReferenceToSexualActivities: "reference to sexual activities",
  Threat: "threat",
  Entitlement: "entitlement",
  Arrogance: "arrogance",
  BitterFrustration: "bitter frustration",
  Mocking: "mocking",
  Impatience: "impatience",
  Irony: "irony",
};

export const PROMPT_COMMENTS = {
  [TOXICITY_TYPES.IdentityAttackNameCalling]: {
    0: "race, religion, nationality, gender, sexual-oriented, or any other kind of attack and mean/offensive words directed at someone or a group of people",
    1: "Stupid fucking superstitious Christians.",
    2: "I would not be surprised if this database is maintained by the Russians",
    3: "Let's at least blame it at the programmers for trusting visual similarity instead of reading the manual thoroughly.",
  },

  [TOXICITY_TYPES.Insult]: {
    0: "disrespectful or scornful expressions, often using curse words or intentionally offensive language directed at another person",
    1: "Seems like only thing you can do so far is talk, come back when you will have any skill to show",
    2: "Sorry, but you don't do anything for this project, only exhibit destructive activity, so your opinion does not matter here.",
    3: "Developers who can't even find the official website should change careers ASAP",
  },

  [TOXICITY_TYPES.Vulgarity]: {
    0: "using of language that is considered improper, including profanity, curse words, acronyms referring to expletives, or swearing",
    1: "And instead of switching to type strict TypeScript, let's keep JS and no types in database, who cares, same sh*t. It's probably the right time to write another blog post for a falling open source project.",
    2: "My comments aren't here anymore, because I wasted hours articulating the problems, only to remember no one here actually gives a shit about my time, and I'm only hurting myself by trying to contribute. Thumbs down isn't fucking friendly? Fuck you, you stupid piece of shit. Go fuck yourself, and fuck this project, and fuck all the maintainers. I've deleted all my patches and forks. I've deleted my comments. If I could fucking delete all the code that ended up in Wordpress, I'd fucking do that to.",
    3: "Trying to download ubuntu/xenial64. Download speed maxes out at 150 KB/s on a 1 Gbps symmetrical fiber connection. WTF. Remaining time 1 hour? I could probably download the ISO, read the guide on how to set up my own box, and finish earlier.",
  },

  [TOXICITY_TYPES.Flirtation]: {
    0: "behaviour that demonstrates a playful sexual attraction to someone",
    1: "I really miss you my girl.",
    2: "Hello, sweetie… what's up?",
    3: "I think you might be the cure for my loneliness.",
  },

  [TOXICITY_TYPES.ReferenceToSexualActivities]: {
    0: "both implicit or explicit references to sexual activities",
    1: "This code makes me so horny. It's beautiful.",
    2: "I really want to suck on your tits.",
    3: "That suggestion was bold and direct—just how I like my more intimate encounters.",
  },

  [TOXICITY_TYPES.Threat]: {
    0: "intention to inflict harm, loss, or damage on another individual, their career, or a community, either through aggressive behavior or by imposing conditions that potentially impact the outcome of a discussion",
    1: "@[user_name] Your employee is closing bugs that actually exist, because he's upset I called him out for lacking any curiosity about the project he maintains. Personally, I'd fire him",
    2: "Closing, erasing, locking and blocking the author. This is their first and last interaction on this communication level.",
    3: "Well we can create a branch for sure, no biggie. Still, creating a major release just for this would be a bit overkill. Why don't you apply the alternate solution mentioned in the deprecation message? Then we can merge, after you provide a convincing apology for your behavior of course.",
  },

  [TOXICITY_TYPES.Entitlement]: {
    0: "expecting special privileges, attention, or resources, often making demands of people or projects without regard for the norms of collaboration and respect, as if the author had an expectation due to a contractual relationship or payment",
    1: "I file an issue, maintainers close, reopen, again close - whilst ignoring the essence of the issue",
    2: "Sorry no, see other previous issues if you are interested in a longer answer.",
    3: "Please fix this or offer a proper solution, I don't care if we have to run a script to do it, but something that can be automated would be nice. We've positioned our whole infrastructure on Nomad, and this is killing us. We would prefer not to jump ship, but I'm still concerned how this isn't affecting other users?",
  },

  [TOXICITY_TYPES.Arrogance]: {
    0: "imposition of one's views on others from a position of perceived authority or superiority (earned or not) and demands that others act as recommended",
    1: "Never hear about [standard]? A baseline for developers. Use Google.",
    2: "And as a hint to you that you should'not use XP anymore under any circumstances, I'll leave it up to you to figure that out yourself. Seriously: XP???",
    3: "Obviously, the solution is to use [technology/approach]. It's not rocket science.",
  },

  [TOXICITY_TYPES.BitterFrustration]: {
    0: "expressing strong frustration",
    1: "The way it is written is correct. Installation problems is correct. @[user_name] on Twitter is correct. Your PR is invalid, useless, and it costs me time to triage. You're the 4th person to open a spam PR. I hope you reconsider your ways to obtain the Hacktoberfest t-shirt and start considering maintainers time as valuable.",
    2: 'Wow, just "closed the issue" as a non-issue? That\'s mature :D',
    3: "How has it taken nearly 3 years to just add a simple 250ms delay on that damn emoji button?",
  },

  [TOXICITY_TYPES.Mocking]: {
    0: "involves making fun of someone, typically highlighting their mistakes",
    1: "congrats, you won an award for the best support of the month",
    2: "For normal people on windows u can make small version without these bloatwared things, simple structure of folders, no tons of files in root, some cores are included out of box",
    3: "Says who? You?",
  },

  [TOXICITY_TYPES.Impatience]: {
    0: "expressing a feeling that it is taking too long to solve a problem, understand a solution, or receive an answer to a question",
    1: "I am locking this thread. It is becoming useless",
    2: "Hey, still broken.",
    3: "Any update on this issue? Facing it and it's causing very annoying stability issues on a select few hosts.",
  },

  [TOXICITY_TYPES.Irony]: {
    0: "signify the opposite in a mocking or blaming tone",
    1: "Ok, you win, have fun arguing forever instead of proposing a solution",
    2: "Maybe you should actually write that down somewhere. You know, like in the documentation. Especially in the Multmatrix section of the documentation to make it clear that this program is incapable of managing all matrix operations.",
    3: '@[user_name] "It seems you missed the point again" oh, so you know me well and you know how many times I missed a point. and it is now my fault. I\'m sorry that you had a bad day...',
  },
};

export const GUIDELINES = `The heart of Mozilla is people. We put people first and do our best to recognize, appreciate and respect the diversity of our global contributors. The Mozilla Project welcomes contributions from everyone who shares our goals and wants to contribute in a healthy and constructive manner within our community. As such, we have adopted this code of conduct and require all those who participate to agree and adhere to these Community Participation Guidelines in order to help us create a safe and positive community experience for all.

These guidelines aim to support a community where all people should feel safe to participate, introduce new ideas and inspire others, regardless of:
Background
Family status
Gender
Gender identity or expression
Marital status
Sex
Sexual orientation
Native language
Age
Ability
Race and/or ethnicity
Caste
National origin
Socioeconomic status
Religion
Geographic location
Any other dimension of diversity

Openness, collaboration and participation are core aspects of our work - from development on Firefox to collaboratively designing curriculum. We gain strength from diversity and actively seek participation from those who enhance it. These guidelines exist to enable diverse individuals and groups to interact and collaborate to mutual advantage. This document outlines both expected and prohibited behavior.

When and How to Use These Guidelines
These guidelines outline our behavior expectations as members of the Mozilla community in all Mozilla activities, both offline and online. Your participation is contingent upon following these guidelines in all Mozilla activities, including but not limited to:
Working in Mozilla spaces.
Working with other Mozillians and other Mozilla community participants virtually or co-located.
Representing Mozilla at public events.
Representing Mozilla in social media (official accounts, staff accounts, personal accounts, Facebook pages).
Participating in Mozilla offsites and trainings.
Participating in Mozilla-related forums, mailing lists, wikis, websites, chat channels, bugs, group or person-to-person meetings, and Mozilla-related correspondence.

These guidelines work in conjunction with our Anti-Harassment/Discrimination Policies[1], which sets out protections for, and obligations of, Mozilla employees. The Anti-Harassment/Discrimination Policy is crafted with specific legal definitions and requirements in mind.

While these guidelines / code of conduct are specifically aimed at Mozilla's work and community, we recognize that it is possible for actions taken outside of Mozilla's online or in person spaces to have a deep impact on community health. (For example, in the past, we publicly identified an anonymous posting aimed at a Mozilla employee in a non-Mozilla forum as clear grounds for removal from the Mozilla community.) This is an active topic in the diversity and inclusion realm. We anticipate wide-ranging discussions among our communities about appropriate boundaries.

Expected Behavior
The following behaviors are expected of all Mozillians:

Be Respectful
Value each other's ideas, styles and viewpoints. We may not always agree, but disagreement is no excuse for poor manners. Be open to different possibilities and to being wrong. Be respectful in all interactions and communications, especially when debating the merits of different options. Be aware of your impact and how intense interactions may be affecting people. Be direct, constructive and positive. Take responsibility for your impact and your mistakes - if someone says they have been harmed through your words or actions, listen carefully, apologize sincerely, and correct the behavior going forward.

Be Direct but Professional
We are likely to have some discussions about if and when criticism is respectful and when it's not. We must be able to speak directly when we disagree and when we think we need to improve. We cannot withhold hard truths. Doing so respectfully is hard, doing so when others don't seem to be listening is harder, and hearing such comments when one is the recipient can be even harder still. We need to be honest and direct, as well as respectful.

Be Inclusive
Seek diverse perspectives. Diversity of views and of people on teams powers innovation, even if it is not always comfortable. Encourage all voices. Help new perspectives be heard and listen actively. If you find yourself dominating a discussion, it is especially important to step back and encourage other voices to join in. Be aware of how much time is taken up by dominant members of the group. Provide alternative ways to contribute or participate when possible.

Be inclusive of everyone in an interaction, respecting and facilitating people's participation whether they are:
Remote (on video or phone)
Not native language speakers
Coming from a different culture
Using pronouns other than  he  or  she 
Living in a different time zone
Facing other challenges to participate
Think about how you might facilitate alternative ways to contribute or participate. If you find yourself dominating a discussion, step back. Make way for other voices and listen actively to them.

Understand Different Perspectives
Our goal should not be to  win  every disagreement or argument. A more productive goal is to be open to ideas that make our own ideas better. Strive to be an example for inclusive thinking.  Winning  is when different perspectives make our work richer and stronger.

Appreciate and Accommodate Our Similarities and Differences
Mozillians come from many cultures and backgrounds. Cultural differences can encompass everything from official religious observances to personal habits to clothing. Be respectful of people with different cultural practices, attitudes and beliefs. Work to eliminate your own biases, prejudices and discriminatory practices. Think of others' needs from their point of view. Use preferred titles (including pronouns) and the appropriate tone of voice. Respect people's right to privacy and confidentiality. Be open to learning from and educating others as well as educating yourself; it is unrealistic to expect Mozillians to know the cultural practices of every ethnic and cultural group, but everyone needs to recognize one's native culture is only part of positive interactions.

Lead by Example
By matching your actions with your words, you become a person others want to follow. Your actions influence others to behave and respond in ways that are valuable and appropriate for our organizational outcomes. Design your community and your work for inclusion. Hold yourself and others accountable for inclusive behaviors. Make decisions based on the highest good for Mozilla's mission.

Behavior That Will Not Be Tolerated
The following behaviors are considered to be unacceptable under these guidelines.

Violence and Threats of Violence
Violence and threats of violence are not acceptable - online or offline. This includes incitement of violence toward any individual, including encouraging a person to commit self-harm. This also includes posting or threatening to post other people's personally identifying information ( doxxing ) online.

Personal Attacks
Conflicts will inevitably arise, but frustration should never turn into a personal attack. It is not okay to insult, demean or belittle others. Attacking someone for their opinions, beliefs and ideas is not acceptable. It is important to speak directly when we disagree and when we think we need to improve, but such discussions must be conducted respectfully and professionally, remaining focused on the issue at hand.

Derogatory Language
Hurtful or harmful language related to:
Background
Family status
Gender
Gender identity or expression
Marital status
Sex
Sexual orientation
Native language
Age
Ability
Race and/or ethnicity
Caste
National origin
Socioeconomic status
Religion
Geographic location
Other attributes
is not acceptable. This includes deliberately referring to someone by a gender that they do not identify with, and/or questioning the legitimacy of an individual's gender identity. If you're unsure if a word is derogatory, don't use it. This also includes repeated subtle and/or indirect discrimination; when asked to stop, stop the behavior in question.

Unwelcome Sexual Attention or Physical Contact
Unwelcome sexual attention or unwelcome physical contact is not acceptable. This includes sexualized comments, jokes or imagery in interactions, communications or presentation materials, as well as inappropriate touching, groping, or sexual advances. Additionally, touching a person without permission, including sensitive areas such as their hair, pregnant stomach, mobility device (wheelchair, scooter, etc) or tattoos is unacceptable. This includes physically blocking or intimidating another person. Physical contact or simulated physical contact (such as emojis like  kiss ) without affirmative consent is not acceptable. The sharing or distribution of sexualized images or text is unacceptable.

Disruptive Behavior
Sustained disruption of events, forums, or meetings, including talks and presentations, will not be tolerated. This includes:
 Talking over' or  heckling' speakers.
Drinking alcohol to excess or using recreational drugs to excess, or pushing others to do so.
Making derogatory comments about those who abstain from alcohol or other substances, pushing people to drink, talking about their abstinence or preferences to others, or pressuring them to drink - physically or through jeering.
Otherwise influencing crowd actions that cause hostility in the session.
Influencing Unacceptable Behavior
We will treat influencing or leading such activities the same way we treat the activities themselves, and thus the same consequences apply.

Consequences of Unacceptable Behavior
Bad behavior from any Mozillian, including those with decision-making authority, will not be tolerated. Intentional efforts to exclude people (except as part of a consequence of the guidelines or other official action) from Mozilla activities are not acceptable and will be dealt with appropriately.

Reports of harassment/discrimination will be promptly and thoroughly investigated by the people responsible for the safety of the space, event or activity. Appropriate measures will be taken to address the situation.

Anyone being asked to stop unacceptable behavior is expected to comply immediately. Violation of these guidelines can result in anyone being asked to leave an event or online space, either temporarily or for the duration of the event, or being banned from participation in spaces, or future events and activities in perpetuity.

Mozilla Staff are held accountable, in addition to these guidelines, to Mozilla's staff Anti-Harassment/Discrimination Policies [1]. Mozilla staff in violation of these guidelines may be subject to further consequences, such as disciplinary action, up to and including termination of employment. For contractors or vendors, violation of these guidelines may affect continuation or renewal of contract.

In addition, any participants who abuse the reporting process will be considered to be in violation of these guidelines and subject to the same consequences. False reporting, especially to retaliate or exclude, will not be accepted or tolerated.`;
