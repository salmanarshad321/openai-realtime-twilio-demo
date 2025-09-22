import { RawData, WebSocket } from "ws";
import functions from "./functionHandlers";

interface Session {
  twilioConn?: WebSocket;
  frontendConn?: WebSocket;
  modelConn?: WebSocket;
  streamSid?: string;
  saved_config?: any;
  lastAssistantItem?: string;
  responseStartTimestamp?: number;
  latestMediaTimestamp?: number;
  openAIApiKey?: string;
}

let session: Session = {};

export function handleCallConnection(ws: WebSocket, openAIApiKey: string) {
  cleanupConnection(session.twilioConn);
  session.twilioConn = ws;
  session.openAIApiKey = openAIApiKey;

  ws.on("message", handleTwilioMessage);
  ws.on("error", ws.close);
  ws.on("close", () => {
    cleanupConnection(session.modelConn);
    cleanupConnection(session.twilioConn);
    session.twilioConn = undefined;
    session.modelConn = undefined;
    session.streamSid = undefined;
    session.lastAssistantItem = undefined;
    session.responseStartTimestamp = undefined;
    session.latestMediaTimestamp = undefined;
    if (!session.frontendConn) session = {};
  });
}

export function handleFrontendConnection(ws: WebSocket) {
  cleanupConnection(session.frontendConn);
  session.frontendConn = ws;

  ws.on("message", handleFrontendMessage);
  ws.on("close", () => {
    cleanupConnection(session.frontendConn);
    session.frontendConn = undefined;
    if (!session.twilioConn && !session.modelConn) session = {};
  });
}

async function handleFunctionCall(item: { name: string; arguments: string }) {
  console.log("Handling function call:", item);
  const fnDef = functions.find((f) => f.schema.name === item.name);
  if (!fnDef) {
    throw new Error(`No handler found for function: ${item.name}`);
  }

  let args: unknown;
  try {
    args = JSON.parse(item.arguments);
  } catch {
    return JSON.stringify({
      error: "Invalid JSON arguments for function call.",
    });
  }

  try {
    console.log("Calling function:", fnDef.schema.name, args);
    const result = await fnDef.handler(args as any);
    return result;
  } catch (err: any) {
    console.error("Error running function:", err);
    return JSON.stringify({
      error: `Error running function ${item.name}: ${err.message}`,
    });
  }
}

function handleTwilioMessage(data: RawData) {
  const msg = parseMessage(data);
  if (!msg) return;

  switch (msg.event) {
    case "start":
      session.streamSid = msg.start.streamSid;
      session.latestMediaTimestamp = 0;
      session.lastAssistantItem = undefined;
      session.responseStartTimestamp = undefined;
      tryConnectModel();
      break;
    case "media":
      session.latestMediaTimestamp = msg.media.timestamp;
      if (isOpen(session.modelConn)) {
        jsonSend(session.modelConn, {
          type: "input_audio_buffer.append",
          audio: msg.media.payload,
        });
      }
      break;
    case "close":
      closeAllConnections();
      break;
  }
}

function handleFrontendMessage(data: RawData) {
  const msg = parseMessage(data);
  if (!msg) return;

  if (isOpen(session.modelConn)) {
    jsonSend(session.modelConn, msg);
  }

  if (msg.type === "session.update") {
    session.saved_config = msg.session;
  }
}

function tryConnectModel() {
  if (!session.twilioConn || !session.streamSid || !session.openAIApiKey)
    return;
  if (isOpen(session.modelConn)) return;

  session.modelConn = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-realtime",
    {
      headers: {
        Authorization: `Bearer ${session.openAIApiKey}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }
  );

  session.modelConn.on("open", () => {
    const config = session.saved_config || {};
    jsonSend(session.modelConn, {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        turn_detection: { type: "server_vad" },
        voice: "ash",
        input_audio_transcription: { model: "whisper-1" },
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
  instructions: `You are a career counsellor, answer questions using the following context:
Stand Taller With Career Guru
Career Guru provides holistic career guidance and support. We can help you reach your Dream Institution or Career through STEPD – a proprietary tool and approach for Strategic Profile Designing and Building developed by our experts from around the globe. We understand that Everyone has a unique story and the way you tell your story makes all the difference. We help you develop and then narrate your story in a strategic perspective – so that you achieve your goal. This will give you competitive advantage over others. The idea is to weave a compelling story of your personal, academic and professional life. Stories take time to build and it’s critically important how you tell them. This is what we call Strategic Profile Designing and Building – STEPD. We work with you over time – maybe weeks or years, to craft a beautiful and impressive story. The earlier we start the better!

Career Guru follows a Scientific, Structured, Strategic and Process driven approach towards profile building – This is our PS3. Whether you are building your profile for admission in Ivy League University, or for Job and Career Development, or for admission in Indian Schools or Institutions like IIM Ahmedabad or ISB, the strategy is always contextualised – one size never fits all. Each scenario will demand a different crafted strategy – to fit for purpose. If you follow guidelines and work on your personalised road map, we will craft for you a portfolio of activities and strategies, to enable you to improve your personal and professional profile in order to achieve your goals. The Strategic Profile Designing and Building exercise will help you to:

Get Admission in top Ivy League Universities and Colleges Abroad
Get Admission in top Indian Institutions
Get Admission in top Schools in India and Abroad
Get Scholarships for Higher Studies
Get your Dream Job and Career
Change your Job and/or Career
A globally competitive profile is required to develop strong differentiation from other students when applying to Top Schools and Ivy League Universities, Scholarships and for Career jumps. If you think marks and academics is the only or even the most important criteria, you are sadly mistaken. Top Institutions evaluate students holistically. They are looking for leaders of tomorrow. They are looking for CEOs, Presidents, and Disruptors of tomorrow. They are looking for overall personality and achievements, apart from academics. Even in academics they want to see not just your percentage but your interest, understanding and passion for the subject.

Career Guru will work with you extensively and in-depth to develop your profile in a strategic manner that communicates excellence, passion, commitment and achievement. This will take a lot of effort from both of us. We mentor over time to assess, understand and accordingly craft a compelling profile based on your strengths, interests, capabilities, passion and dislikes through academic and extra-curricular inputs. We work with you individually and design a year-by-year personalised strategy, if you have the time or we can work in a capsule module (if you need everything in 5 days…we hope not). You will stand taller with Career Guru!

When to Start?
Starting ASAP – as soon as possible – is very important. Remember Rome was not built in a day. Its important to know where you stand compared to others from around the world and what parts of your profile need to be addressed to take corrective action. Career Guru would like to start working together with you at least 2-3 years before you plan to undertake your most important learning journey. This is required for extensive and a globally competitive profile building strategy. We suggest you start as early as class VIII or IX if you want to study abroad in a good institution after class 12th. Even if you start in class 10th it’s just about fine, though you will have your Board Examinations and that’s priority. It is time to start work on building your profile. This way you will have at least two summers to do enhancements programs and develop required skills.

When you start early you have time to explore and work upon multiple aspects – you will have optimum time to strategically design and develop your profile, choose stream accordingly, complete application process in good time, prepare for tests and interviews, apply for scholarships etc which works at least one year in advance. For example, if you plan to start UnderGrad in October 2022, last date for submitting application for top universities like University of Cambridge and Oxford will be September 2021. By early 2021 you need to start working on choosing your course, meeting eligibility criterion, completing your application form, writing essays, finalise SOP, get LORs written, prepare and appear for Admission and Language Tests, apply for Scholarships, prepare and appear for interviews both for admission and scholarships, then prepare and appear for Visa interview, then plan for pre-departure arrangements, financing and loaning, make up your mind on accommodation choices, search for best student travel deals, and then fly off…before a new set of activities begin as soon as you arrive. We will prepare you for that as well.

Remember we have only listed activities here – all this needs to be done. Of course you have Career Guru on your side. We know what we do. That’s why we put it here on the website…for you to read and realise. No one else will tell you this upfront, but we do. Career Guru will provide a clear, personalised, dated, activity-wise action plan to ensure you reach top global schools. We know what and how to deliver!

Simply put start as early as possible, at-least 2-3 years in advance if you want to reach the best. We do deliver last minute execution as well. We have experience and expertise in working on short notices and last minute profiling…you know how students are. Many are always doing it on the last day! But it is a stretch. It is tense and anxious. It is difficult. We prefer, you do it well in time, because ultimately our performance depends on your success, and we are passionate about our performance. We are the best education consultant there is!

Work the Process
We have developed a systematic, holistic strategy based on research on what Top Institutions, Schools, Colleges, Universities and Companies are looking for in an ideal candidate. Most importantly the Plan of Action we provide is very specific, detailed and personalised – it’s you in a nutshell. Our mentors have depth of experience and width of expertise. They have each worked with top Indian and International Institutions, Universities and Companies. They will hold your hand, unleash your potential, and develop your map for success.

First step: Who are You?
First step in the process is to understand YOU and your story. Through a series of interactions and assessments we identify your strengths, weaknesses, traits, likes, dislikes, personality type, academic interests, passion, dreams, aspirations and occupational fit.

Second Step: Goal Identification and Target Fixing
Based on personality assessment and preliminary discussion we identify what you want to do and Set Targets accordingly. We will identify subjects and career choices, develop short term and long term goals. Next step is to build your academic and professional profile.

Third Step: Highlight your USP
We identify your strengths layer by layer, and unique propositions, and devise strategies to highlight them in your profile to give you a competitive edge over competitors. It is not a cut and paste job. Our editors will ensure that you have a unique profile.

Fourth Step: Strategic Action Plan
Career Guru will identify your weak spots, insecurities and anxieties and work towards resolving them. We identify gaps between where you are and where you need to be. On this basis we will carve out a personalised Strategic Action Plan – SAP for next 2, 3 or 4 years (or 4 weeks) depending on time available. SAP, though not limited to, but will include actionable agenda with specific timelines like:

Summer Plan: We will plan what you must fulfil in summers during school break. Summer Enrichment Plan will focus on what you need to strengthen further or skills and capabilities that you need to develop anew. Especially important are summers before class 9, 10, 11, and 12th if you are interested in a first degree, and then all years at the graduate level if you are interested in a post graduate program or MBA.
Extra Curricular Strategy: We will guide you which school clubs to join and which social work projects and social initiatives to undertake. For example, if you want to graduate in Theater it makes sense to be a part of Drama class in school. If you want to do Political Science, being active in Debating Soc will send the right message to admission officers. Similarly for Music, Art, Travel, School Newspaper or Robotics.
Internships: We will advise you on which internships to apply for which will give you a sense of the course and job that you think you want to pursue. We will also help you apply and prepare for interviews because good internships are few and difficult to get through. They are important because they give you a first hand experience of the track that you want to pursue in life. You must take this very seriously.
Summer Schools: This gives you an opportunity to enhance existing skills or develop new skills and capabilities, or just to explore a passion or hidden calling. Planning for summer schools while keeping your profile in mind can give you an edge when competing for those top places.
Coursework Planning Strategy: This will focus on stream and subject selection. We will also guide you on how to synchronise your career goals with learning resources available like online classes and part-time courses. Example: Learn new skills through certification courses, Internships, participate in workshops, conferences, competitions, special projects, Model United Nations etc.
Community Commitment: A good citizen wants to give back and nurture society. We will guide you on how you can choose projects, programs, places or NGOs to engage with depending on your choice, abilities and future goals in life and career. Example: Organise social service events like blood donation camp, teaching underprivileged children, or helping at an old age home.
Communication and Presentation Strategy: Communication is a critical life skill. Synthesising your thoughts and plans into actionable strategy always needs to be presented and communicated to a wider audience. It is extremely desirable for all roles and walks of life and career. We will specifically work with you on developing your communication skills.
Leadership: This is a highly desirable trait both in the government and corporate sector. It shows passion and ability to motivate and influence others to achieve a desirable outcome. It shows teamwork. We will work together with you to develop and present your leadership story. Example: organise cultural or technical events and festivals; undertake civic initiatives such as cleaning a river or local park, spreading awareness about healthy living, organise half marathon for a social or civic cause or raise fund for a social cause like earthquake relief or flood or drinking water.
Entrepreneurship: We will write it up as a case study for you to present to a global audience if you have entrepreneurship experience. It shows passion, commitment, risk taking, ability to organise and lead from the front, and all round organisational capability. Learnings can be drawn from success and failure – they are both valuable for us.
Research opportunities: You can engage in multiple research projects if that is your aptitude and field of interest. We will help you identify a strategic fit between your choice, ability and opportunity.
Publications & Digital Strategy: This shows excellence, commitment, research capability, thinking and articulation ability, logic, structuring, language command and ability to engage with a topic or subject over a longer period of time – thus exhibiting passion. This can be extremely influential for certain degrees and job choices. Digital strategy will encompass your social media presence, profile, engagement, video CV, Linkedin, Facebook management etc. Example: Publish articles, research work, write blog, develop own youtube channel.
Change Management/Transformation: We will help you synthesise and articulate a success story if there is one to be told. Or a failure story. Equally valuable!
Remember all of these points will equally apply to none. Your story will be a unique story because you are a unique person. Activities we suggest are personalised and goal specific. That is our entire focus. Your individuality is precious. We want to put it forward to the world, organised and packaged as best as it can be.

Fifth Step: Put Best Foot Forward!
Now its execution time, time to work your unique powerful Profile. We have already identified what defines you, your strengths, and concerns. They will help develop an impressive academic and professional profile – that will enable you to stand out even in the face of toughest global competition.

Sixth Step: Test and Interview Preparation
Different Colleges and Universities have different admission requirements. For many you are required to take standardised tests, for example, IELTS or TOFEL or PE for English Proficiency, GMAT for MBA, CAT for MBA in India for IIMs and other Premier Institutions, LSAT for Law School Admission Abroad and CLAT for law in India, MCAT for medical schools abroad and MBBS in India, ACT, SAT to name a few. You are required to send scores of these tests with your application to Institutions of your choice. Career Guru helps identify the tests required to follow your chosen stream/course and line of career and helps you in its preparation.

We would love to meet you in person, but if inconvenient, we can talk on the phone or do a video call. Our first session will typically take 30 minutes, though we are not looking at the watch. We will develop a Plan of Action to which you will commit yourself. Counselling frequency will be determined by what and how much you want to achieve. It can typically last 6-10 sessions spread over 5-6 months. Sessions will strive for holistic guidance based on your passion, interest, education, work, and life balance to bring out the best that you can be. Confidentiality is strictly ensured.

Know more About Test Prep
We will train you for Admission Interview Preparation for Indian as well as International Institutions, Scholarships, Visa, Internships and Job Interviews. Prepare with our mentors at Career Guru and through expert advice, mock interviews and detailed feedback on your performance, reach your Dream Institution or Organisation.

Know more About Interview Prep
Through this elaborate, personalised, in-depth six-step Strategic Profile building exercise Career Guru offers end to end support to fulfil your dreams and goals. Our mentors from Top Universities will plan and build your Profile over years, giving you global competitive advantage.`,
        ...config,
      },
    });

    // Immediately queue an opening user message so the assistant responds first.
    // const openingLine =
    //   config?.opening_line ||
    //   process.env.AI_OPENING_LINE ||
    //   "Hello! I'm your AI assistant. How has your experience been with your vehicle so far?";

    // jsonSend(session.modelConn, {
    //   type: "conversation.item.create",
    //   item: {
    //     type: "message",
    //     role: "user",
    //     content: [
    //       {
    //         type: "input_text",
    //         text: openingLine,
    //       },
    //     ],
    //   },
    // });
    jsonSend(session.modelConn, { type: "response.create" });
  });

  session.modelConn.on("message", handleModelMessage);
  session.modelConn.on("error", closeModel);
  session.modelConn.on("close", closeModel);
}

function handleModelMessage(data: RawData) {
  const event = parseMessage(data);
  if (!event) return;

  jsonSend(session.frontendConn, event);

  switch (event.type) {
    case "input_audio_buffer.speech_started":
      handleTruncation();
      break;

    case "response.audio.delta":
      if (session.twilioConn && session.streamSid) {
        if (session.responseStartTimestamp === undefined) {
          session.responseStartTimestamp = session.latestMediaTimestamp || 0;
        }
        if (event.item_id) session.lastAssistantItem = event.item_id;

        jsonSend(session.twilioConn, {
          event: "media",
          streamSid: session.streamSid,
          media: { payload: event.delta },
        });

        jsonSend(session.twilioConn, {
          event: "mark",
          streamSid: session.streamSid,
        });
      }
      break;

    case "response.output_item.done": {
      const { item } = event;
      if (item.type === "function_call") {
        handleFunctionCall(item)
          .then((output) => {
            if (session.modelConn) {
              jsonSend(session.modelConn, {
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: item.call_id,
                  output: JSON.stringify(output),
                },
              });
              jsonSend(session.modelConn, { type: "response.create" });
            }
          })
          .catch((err) => {
            console.error("Error handling function call:", err);
          });
      }
      break;
    }
  }
}

function handleTruncation() {
  if (
    !session.lastAssistantItem ||
    session.responseStartTimestamp === undefined
  )
    return;

  const elapsedMs =
    (session.latestMediaTimestamp || 0) - (session.responseStartTimestamp || 0);
  const audio_end_ms = elapsedMs > 0 ? elapsedMs : 0;

  if (isOpen(session.modelConn)) {
    jsonSend(session.modelConn, {
      type: "conversation.item.truncate",
      item_id: session.lastAssistantItem,
      content_index: 0,
      audio_end_ms,
    });
  }

  if (session.twilioConn && session.streamSid) {
    jsonSend(session.twilioConn, {
      event: "clear",
      streamSid: session.streamSid,
    });
  }

  session.lastAssistantItem = undefined;
  session.responseStartTimestamp = undefined;
}

function closeModel() {
  cleanupConnection(session.modelConn);
  session.modelConn = undefined;
  if (!session.twilioConn && !session.frontendConn) session = {};
}

function closeAllConnections() {
  if (session.twilioConn) {
    session.twilioConn.close();
    session.twilioConn = undefined;
  }
  if (session.modelConn) {
    session.modelConn.close();
    session.modelConn = undefined;
  }
  if (session.frontendConn) {
    session.frontendConn.close();
    session.frontendConn = undefined;
  }
  session.streamSid = undefined;
  session.lastAssistantItem = undefined;
  session.responseStartTimestamp = undefined;
  session.latestMediaTimestamp = undefined;
  session.saved_config = undefined;
}

// Exported helper to allow external modules (e.g. function handlers) to trigger a full disconnect.
export function forceDisconnect() {
  closeAllConnections();
}

function cleanupConnection(ws?: WebSocket) {
  if (isOpen(ws)) ws.close();
}

function parseMessage(data: RawData): any {
  try {
    return JSON.parse(data.toString());
  } catch {
    return null;
  }
}

function jsonSend(ws: WebSocket | undefined, obj: unknown) {
  if (!isOpen(ws)) return;
  ws.send(JSON.stringify(obj));
}

function isOpen(ws?: WebSocket): ws is WebSocket {
  return !!ws && ws.readyState === WebSocket.OPEN;
}
