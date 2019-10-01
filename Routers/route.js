const MongoClient = require('mongodb').MongoClient;
const SlackBot = require('slackbots'); 
const emoji = require('../slack_emoji');
const url = 'mongodb://13.124.65.242:27017/';
const url2 = 'mongodb://13.124.65.242:27017/userdb';
const fs=require('fs');
const axios = require('axios');

//Initialize message recieved time and array size for static use
message_recieved = 0;
ary_size=0;

exports.startbot = ()=>{
    // Get authorization to use the slackbot
    const bot = new SlackBot({
        token : "Token",
        name : "joker"
    });
    
    // Start the slackbot
    bot.on('start', () =>{
        //Figure out user's all current channels in the team
        channel = bot.getChannels();
        channel.then((data)=>{
        channel_length = data.channels.length; 
        for(i=0; i< channel_length; ++i){
            //postMessageToChannel(name, message [, params, callback]) (return: promise) - posts a message to channel by name.
            bot.postMessageToChannel(data.channels[i].name, 'Have some fun with @Joker!\nFor commands write @jokebot --help', 
            emoji.emojis('bowtie'));
        }
        return data;
    })
    .then((data)=>{
        //print the words when bot.on worked successfully
        console.log('Successfully started app to all channels');
    })  
    });
    // Error Handler
    bot.on('error', (err) => console.log(err));

    //Message Handler
    bot.on('message', (data) => {
    if(data.type !== 'message'){
        return;
    }

    status = data;
  

    //Figure out which channel the user is sending message
    //If it's first input from the user, go through this loop to store the data of channel names and ids
    if(message_recieved == 0){
        channel_length;
        channel_names = [];
        channel_ids = []; 
        //bot.getChannels() returns a list of all channels in the team
        channel = bot.getChannels();
        channel.then((data)=>{
            channel_length = data.channels.length;
            for(i=0; i< channel_length; ++i){
                channel_names.push(data.channels[i].name);
                channel_ids.push(data.channels[i].id);
            }
            return data;
        })
        .then((result)=>{
           ++message_recieved;
           console.log("User Channel list: " + channel_names)
           for(i=0; i< channel_length; ++i){
            if(channel_ids[i] == status.channel){
                handleMessage(status.text, channel_names[i]);
            }
        }
        })
    }
    console.log(status);

    //If it's not the first user input, goes through simple loop to shorten response time
    if(message_recieved > 0){
        for(i=0; i< channel_length; ++i){
            if(channel_ids[i] == status.channel)
                handleMessage(status.text, channel_names[i]);
        }
    }
    //handleMessage(data.text);
});

// Responding to Data
function handleMessage(message, current_channel){
    console.log(message);
//Handles message response depending on the user message
    if(message.includes(' tell me') || message.includes(' Tell me')){
        if(message.includes(' knock')){
            knockknockJoke(current_channel);
        }
        else if(message.includes(' general')){
            generalJoke(current_channel);
        }

        else if(message.includes(' random') || message.includes(' some joke') || message.includes(' funny joke')){
            randomJoke(current_channel);
        }
    
        else if(message.includes(' programming')){
            programmingJoke(current_channel);
        }
        else if(message.includes(' reddit')){;
            redditJoke(current_channel);
        }
        else if(message.includes(' funny story')){
            Funnystory(current_channel);
        }
        else if(message.includes(' my joke') || message.includes(' myjoke')){
            UserMakeJoke(message,current_channel);
        }  
        else if(message.includes(' me')){
            comment = "Please use @jokebot --help to know what I can do!:smile::smile::smile:\n You can write type of joke[knock-knock, general, programming, funny story, reddit]";
            bot.postMessageToChannel(current_channel, "Tell you what??? :no_mouth:", emoji.emojis('no_mouth'));
            bot.postMessageToChannel(current_channel, comment, emoji.emojis('flushed'));
        }
        
    }
    else if(message.includes(' -help')){
       runHelp(current_channel);
    }
    else if(message.includes(' what jokes')){
        jokeTypes = ["general", 'programming', 'knock-knock','reddit','funny story'];
        bot.postMessageToChannel(current_channel, `I have ${jokeTypes[0]}, ${jokeTypes[1]}, ${jokeTypes[2]},${jokeTypes[3]},${jokeTypes[4]} jokes!! :thumbsup: :thumbsup:`, emoji.emojis('thumbsup'));
        return;
    }
    else if(message.includes(' make joke : '))
    {
        MakeJoke(message,current_channel);
    }
}

function MakeJoke(message,user_channel){
    var obj={
        table:[]
    }
    var input=message.split(':');
    var msg=input[1].split(',');
    var temp=message.split(' ');
    var user=temp[0].substring(2,temp[0].length-1);
    console.log(' => '+user);

    var path='./joke_data/user.json';
    fs.exists(path,function(exists){
        if(exists){
            console.log("yes file exists");
            fs.readFile(path,function readFileCallback(err,data){
                if(err){
                    console.log(err);
                }
                else{
                    obj=JSON.parse(data);
                    var length=obj.table.length;
                    obj.table.push({id : length+1, type : user, setup : msg[0], punchline : msg[1]});
                    //var myobj = {id : length+1, type : user, setup : msg[0], punchline : msg[1]};
                    MongoClient.connect(url,function(err,db){
                        if(err) throw err;
                        var dbo = db.db("userdb");
                        var array = dbo.collection('user').find({type : user}).toArray(function(err,docs){
                            if(err){
                                callback(err,null);
                                return ;
                            }
                            
                            console.log(docs.length);
                            var myobj = {id : docs.length+1, type : user, setup : msg[0], punchline : msg[1]};
                            dbo.collection("user").insertOne(myobj, function(err,res){
                                if(err) throw err;
                                console.log("1 inserted!!");
                                db.close();
                            }) 
                        });
                    
                    })
                    var json=JSON.stringify(obj);
                    fs.writeFile(path,json,'utf8',function(err){
                        if(err){
                            console.log(err);
                        }
                        console.log('complete');
                    });
                }
            });
            comment="Sucess making joke!!:+1::thumbsup:\nWhen you want to show your joke, please enter @jokebot tell-me-my-joke";
            bot.postMessageToChannel(user_channel,`${comment}:kissing_heart:`,emoji.emojis('nerd_face'));
        }
        else{
            console.log("file not exists");
            obj.table.push({id : 1, type : user, setup : msg[0], punchline : msg[1]});
            var myobj = {id : 1, type : user, setup : msg[0], punchline : msg[1]};
                   
            MongoClient.connect(url,{ useNewUrlParser: true },function(err,db){
                    if(err) throw err;
                    var dbo = db.db("userdb");
                    dbo.collection("user").insertOne(myobj, function(err,res){
                        if(err) throw err;
                        console.log("1 insert!!");
                        db.close();
                    }) 
            });
            var json=JSON.stringify(obj);
            fs.writeFile(path,json,'utf8',function(err){
                if(err){
                    console.log(err);
                }
                console.log('complete');
            });
            comment="Sucess making joke!!:+1::thumbsup:\nWhen you want to show your joke, please enter @jokebot tell-me-userjoke";
            bot.postMessageToChannel(user_channel,`${comment}:kissing_heart:`,emoji.emojis('nerd_face'));
        }
    })
   
}


//Gets a random integer
function getRandomInt(start,end) {
    return Math.floor((Math.random() * 100)%(end-start))+start;
}



//Function for giving out random joke
randomJoke= (user_channel)=>{
    //Connect to mongodb client
    MongoClient.connect('mongodb://13.124.65.242:27017/', function (err, client){
    if (err) throw err; 
    //go into database name jokeapi
    var db = client.db('jokeapi');

    //set the maximum number of api formats and get a random integer
    random = getRandomInt(1,377);
    //Go to jokes collection inside jokeapi database and find one joke randomly by putting a random number
    result = db.collection('jokes').findOne({id: random});   
    
    user = result;
    //After finding one joke, use promise to run codes synchronously
    user.then(function(total){
        question = total.setup;
        bot.postMessageToChannel(user_channel, question, emoji.emojis('laughing'));
        console.log("random Question called");
        return total;
    })
    .then((all)=>{
        joke=all.punchline;
         //Use setTimeout function to delay the code execution, making sure the user reads the question first and then see the final funny joke
         setTimeout(function secondFunction(){
            bot.postMessageToChannel(user_channel,`${joke}:stuck_out_tongue_winking_eye::laughing:`,emoji.emojis('laughing'));
            console.log("random Punchline goes~~~~~~!");
        },3000);
    })
    //close mongodb
    client.close();
    })
}

// Function for giving out users making joke
UserMakeJoke= (message,user_channel)=>{

    var temp=message.split(' ');
    var user=temp[0].substring(2,temp[0].length-1);
    console.log('=> '+user);

    MongoClient.connect('mongodb://13.124.65.242:27017', function (err, client){
    if (err) throw err; 
    //go into database name jokeapi
    var db = client.db('userdb');
    var array = db.collection('user').find({type: user}).toArray(function(err,docs){
        if(err){
            callback(err,null);
            return;
        }
        ary_size=docs.length;
        console.log(docs.length);
        var random=getRandomInt(1,ary_size+1);
        console.log(random);
        var result=docs[random-1];
        user = result;
        console.log(user);

        question = user.setup;
        joke=user.punchline;
        bot.postMessageToChannel(user_channel, question, emoji.emojis('laughing'));
        console.log("User's joke question called");
        setTimeout(function secondFunction(){
            bot.postMessageToChannel(user_channel,`${joke}:stuck_out_tongue_winking_eye::laughing:`,emoji.emojis('laughing'));
            console.log("User's joke sent~~~~~~!");
        },3000);
        
    });

    //close mongodb
    client.close();
    })

    
}

//Function for giving out random joke after filtering only general type jokes
generalJoke= (user_channel)=>{
    MongoClient.connect(url, function (err, client){
        if (err) throw err; 
        var db = client.db('jokeapi');
    
        random = getRandomInt(24,377);
        result = db.collection('jokes').findOne({id: random});   
        user = result;
        //if the random picked api type is not general execute the function from the start to get another format for general type
        user.then(function(total){
            question = total.setup;
            bot.postMessageToChannel(user_channel,question,emoji.emojis('laughing'));
            console.log('General question called');
            return total;
        })
        .then((all)=>{
            joke=all.punchline;
            //Use setTimeout function to delay the code execution, making sure the user reads the question first and then see the final funny joke
            setTimeout(function secondFunction(){
                bot.postMessageToChannel(user_channel,`${joke}:stuck_out_tongue_winking_eye::laughing:`,emoji.emojis('laughing'));
                console.log("General punchline~~~~~~!");
            },3000);
        })
        client.close();
        })
    };

//Function for giving out random joke after filtering only programming type jokes
programmingJoke= (user_channel)=>{
        MongoClient.connect(url, function (err, client){
        if (err) throw err; 
        var db = client.db('jokeapi');
    
        random = getRandomInt(1,19);
        result = db.collection('jokes').findOne({id: random});   
        user = result;
        user.then(function(total){
            question = total.setup;
            bot.postMessageToChannel(user_channel,question,emoji.emojis('laughing'));
            console.log("Programming question called");
            return total;
        })
        .then((all)=>{
            joke=all.punchline;
            //Use setTimeout function to delay the code execution, making sure the user reads the question first and then see the final funny joke
            setTimeout(function secondFunction(){
                bot.postMessageToChannel(user_channel,`${joke}:stuck_out_tongue_winking_eye::laughing:`,emoji.emojis('laughing'));
                console.log("Programming joke called~~~~~!");
            },3000);
        })
        client.close();
        })
    };



//Function for giving out funny story 
Funnystory= (user_channel)=>{
    MongoClient.connect(url, function (err, client){
        if (err) throw err; 
        var db = client.db('FunnyStoryapi');
    
        random = getRandomInt(1,201);
        result = db.collection('FunnyStory').findOne({id: random});   
        user = result;
        //if the random picked api type is not general execute the function from the start to get another format for general type
        user.then(function(total){
            cate = total.category;
            story = total.body;
            category_story=cate+'\n'+story+':stuck_out_tongue_winking_eye::laughing:';
            bot.postMessageToChannel(user_channel, category_story, emoji.emojis('smiley'));
            console.log("Funny story~~~");
        })
        client.close();
        })
    };
        

//Function for giving out random joke after filtering only reddit jokes
redditJoke= (user_channel)=>{
    MongoClient.connect(url, function (err, client){
        if (err) throw err; 
        var db = client.db('redditjoke');
    
        random = getRandomInt(1,71);
        result = db.collection('reddit').findOne({id: random});   
        user = result;
        //if the random picked api type is not general execute the function from the start to get another format for general type
        user.then(function(total){
             title = total.title;
             bot.postMessageToChannel(user_channel, title, emoji.emojis('smiliey'));
             console.log("reddit joke question");
             return total;
        })
        .then((all)=>{
            joke=all.body;
            //Use setTimeout function to delay the code execution, making sure the user reads the question first and then see the final funny joke
            setTimeout(function secondFunction(){
                bot.postMessageToChannel(user_channel,`${joke}:stuck_out_tongue_winking_eye::laughing:`,emoji.emojis('laughing'));
                console.log("reddit punchline!");
            },3000);
        })
        client.close();
        })
    };        
//Function for giving out random joke after filtering only knock-knock type jokes
knockknockJoke= (user_channel)=>{
    MongoClient.connect(url, function (err, client){
        if (err) throw err; 
        var db = client.db('jokeapi');
        
        random = getRandomInt(19,24);
        result = db.collection('jokes').findOne({id: random});   
        user = result;
        user.then(function(total){
            question = total.setup;
            bot.postMessageToChannel(user_channel, question, emoji.emojis('laughing'));
            console.log("knock-knock called");
            return total;
        })
        .then((all)=>{
            joke=all.punchline;
            setTimeout(function secondFunction(){
                bot.postMessageToChannel(user_channel,`${joke}:stuck_out_tongue_winking_eye::laughing:`,emoji.emojis('laughing'));
                console.log("knockknock answer~~~~~~!");
            },3000);
        })
        client.close();
        })
    }

//Function for giving out information to user to control the bot
runHelp = (user_channel) =>{
    
    comment = "Thanks for using jokebot bot!:ghost::ghost:laugh:\nBot info: type '@jokebot help' for infos\nBot functions: '@jokebot tell-me [something] joke' will send related jokes, if I don't have what you mentioned, I will tell you I don't have that joke:smile:\n"
    current_jokes = "Joke types I have: 1)general , 2)knock-knock , 3)programming , 4)reddit, 5)funny story:laughing:\n";
    ownJoke = "Wanna add your own joke? Just type '@jokebot [make joke : (question), (your joke)]' ! Want to check what jokes you added? Just simply type '@jokebot tell me my joke:smiley:'";
    bot.postMessageToChannel(user_channel, comment + current_jokes + ownJoke ,emoji.emojis('question'));
    }
}
