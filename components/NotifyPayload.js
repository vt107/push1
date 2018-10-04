export default class NotifyPayload {
  key: string;
  title: string;
  message: string;
  topic: string;
  topicText: string;
  level: number;
  time: string;
  seen: boolean;

  constructor(obj: Object, isSeen: false) {
    this.key = obj.key;
    this.title = obj.title;
    this.message = obj.message;
    this.topic = obj.topic;
    this.topicText = obj.hasOwnProperty('topic_text')? obj.topic_text: '';
    this.level = parseInt(obj.level);
    this.time = obj.time;
    this.seen = isSeen;
  }
};