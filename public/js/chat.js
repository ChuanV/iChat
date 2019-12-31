$(function() {
    sessionStorage.clear();
    var interval0;
    var onlineUsers = [];
    var MSG = {
        name:'',		//用户名
        toUser:'everyone', //与之聊天的用户或者是多人
        type:'chat',     //chat 多人聊天 chatTo私人聊天 setname广播用户名
        message:'',      //聊天的内容
        pic:'',           //聊天的图片
    }
    //文件上传
    $('#allCategoryFile').change(function(event) {
        var formData = new FormData();
        var pic_flie = $('#allCategoryFile')[0].files[0]
        if(!pic_flie) return;
        formData.append("file",pic_flie);
        formData.append("sender", MSG.name);
        formData.append("receiver", MSG.toUser);
        $.ajax({
            url : '/upload',
            dataType:'json',
            type:'POST',
            data : formData,
            processData : false, // 使数据不做处理
            contentType : false, // 不要设置Content-Type请求头
            success:function(res){
                res.fileInfo.size = parseInt(res.fileInfo.size / 1024) + 'KB'
                var fileUrl = '/uploads/allFiles/' + res.fileInfo.originalname
                MSG.pic = '';
                MSG.type = 'chat';
                var str =  `<div class="fileBox">
                                <a href="${fileUrl}" download="${res.fileInfo.originalname}">
                                    <div class="fileInfo">
                                        <p>${res.fileInfo.originalname}</p>
                                        <p class="fileSize">${res.fileInfo.size}</p>
                                    </div>
                                    <div class="fileIcon">
                                        <img src="/public/img/file.jpg" >
                                    </div>
                                </a>
                            </div>`
                MSG.message = str
                ws.send(JSON.stringify(MSG))
            }
        })
        $(this).val('')
        // event.target.value='';//解决选择同一个文件不触发change事件,会出现后面获取不到文件的坑 
    })
    //视频上传
    $('#filmFile').change(function(event) {
        var formData = new FormData();
        var pic_flie = $('#filmFile')[0].files[0]
        formData.append("file",pic_flie);
        formData.append("sender", MSG.name);
        formData.append("receiver", MSG.toUser);
        var fileLastName = getFileType(pic_flie.name)
        console.log(fileLastName);
        
        if(fileLastName != 'mp4' && fileLastName != 'avi' && fileLastName != 'rmvb'){
            alert("请选择视频文件")
            pic_flie = '';
            return ;
        }
        $.ajax({
            url : '/upload',
            dataType:'json',
            type:'POST',
            data : formData,
            processData : false, // 使数据不做处理
            contentType : false, // 不要设置Content-Type请求头
            success:function(res){
                // res.fileInfo.size = parseInt(res.fileInfo.size / 1024) + 'KB'
                var fileUrl = '/uploads/allFiles/' + res.fileInfo.originalname
                MSG.pic = '';
                MSG.type = 'chat';
                var str =  `<div class="film"><video src="${fileUrl}" controls="controls"  height="200" >
                您的浏览器不支持 video 标签。
                </video></div>`
                MSG.message = str
                ws.send(JSON.stringify(MSG))
            }
        })
        $(this).val('')
    })
    //显示图片信息
    $('#pic_file').change(function(event) {
        var pic_flie = $('#pic_file')[0].files[0]
        if (pic_flie) {
            var size = pic_flie.size
            if (size > 1024 * 1024 * 5) {
                alert("选择的文件过大，只能选择5M以下")
                $(this).val('')
                return;
            }
            var fileLastName = getFileType(pic_flie.name)
            if(fileLastName != 'jpg' && fileLastName != 'png' && fileLastName != 'gif'){
                alert("请选择图片文件")
                pic_flie = '';
                return ;
            }
            //图片转base64上传
            var reader = new FileReader()
            reader.readAsDataURL(pic_flie)
            reader.onload = function() {
                MSG.pic = reader.result
            }
            size = parseInt(size / 1024) + 'kb'
            var name = pic_flie.name
            $('#pic_file_info').text(name + '   ' + size)
        }
        $(this).val('')
        // event.target.value='';//解决选择同一个文件不触发change事件,会出现后面获取不到文件的坑 
    })      

    var ws = null;
    MSG.name = $('#username').text()
    //新建一个WebSocket实例化对象
    ws = new WebSocket('ws://' + window.location.host + ':1234')
    //连接打开的回调事件
    ws.onopen = function() {
        console.log('websocket连接开启...')
        ws.send(JSON.stringify({
            name:MSG.name,
            type:'setname'
        }))
    }
    //接收服务器端的消息
    ws.onmessage = function(e) {
        var data = JSON.parse(e.data)
        // console.log('接收服务器发送过来的消息。。。');
        // console.log(data);
        //在线用户显示
        if (data.type === 'chatterList') {
            var allUser = JSON.parse(data.list)
            // console.log(allUser);
            // return
            $('#allOnline').html('')
            $('#allOnline').html('<p>用户列表(' + (allUser.chatterArr.length+allUser.offUser.length)  + ')</p>')
            $('#allOnlinelist').html('')
            onlineUsers = allUser.chatterArr;
            for (var i = 0; i < allUser.chatterArr.length; i++) {
                $('#allOnlinelist').append('<p>' + allUser.chatterArr[i] + '[在线]</p>')
            }
            for (var i = 0; i < allUser.offUser.length; i++) {
                $('#allOnlinelist').append('<p>' + allUser.offUser[i] + '[离线]</p>')
            }
            
        } else if(data.type === 'serverInformation'){
            if(MSG.toUser == 'everyone'){
                $('#message').append(creatChatDiv(data))
            }
        }else if(data.type === 'call'){
            $('.caller').text(data.name)
            $('#notification').css("bottom", "0px");
            var ellipse = $('#ellipse');
            var ellipses = ['', '.', '..', '...'];
            var index = 0;
            interval0 = setInterval(() => {
                if(index == 4) {
                    index = 0;
                }
                ellipse.text(ellipses[index])
                index++;
            },500)
        } else {
            //群聊消息显示
            if(data.toUser == 'everyone'){
                //仅用户在聊天页面时，向他们显示聊天消息
                if(MSG.toUser == 'everyone'){
                    $('#chatToUserName').text("群聊")
                    $('#message').append(creatChatDiv(data))
                    if (data.pic) {
                        $('#message').append("<div class='pic_height'><img src='" + data.pic + "'></div>")
                    }
                }else{
                    //否则保存消息到本地
                    var str = "<div><p><span>" + data.name.toString() +  "</span>:"+ data.message.toString() + "</p>" + "<p class='time'>" + dateForm() + '</p></div>'
                    chatDataSave(str.toString(),'everyone')
                }
            }else{
                //私聊消息显示
                //仅当双方都在聊天页面时，向他们显示聊天消息
                //MSG.toUser 聊天对方，data.name 服务器给谁的数据
                if(MSG.toUser == data.name || data.name == MSG.name){
                    if(data.name == MSG.name){
                        $('#message').append(creatChatDiv(data))
                    }else{
                        $('#message').append(creatChatDiv(data))
                        $('#chatToUserName').text("正在与"+data.name+"聊天...")
                    }
                    if (data.pic) {
                        $('#message').append("<div class='pic_height'><img src='" + data.pic + "'></div>")
                    }
                }else{
                    //否则保存消息到本地
                    var str = "<div><p><span>" + data.name.toString() +  "</span>:"+ data.message.toString() + "</p>" + "<p class='time'>" + dateForm() + '</p></div>'
                    chatDataSave(str.toString(),data.name)
                }
            }
            setTimeout(function() {
                ($('#message').children("div:last-child")[0]).scrollIntoView();
            }, 100);

        }
    }
    $('#submit').click(function() {
        sendMsg();
    })
    $('#content').keyup(function(e) {
        if (e.keyCode !== 13) return;
        sendMsg();
    })
    //点击用户进入私聊
    $('#allOnlinelist').on('click','p',function(){
        $(this).siblings('p').removeClass('chatUser')
        //点击自己回到群聊
        var toname = $(this).text()
        toname = toname.substring(0,(toname.length-4))
        if(MSG.name == toname){
            MSG.type = 'chat'
            MSG.toUser = 'everyone'
            $('#chatToUserName').text("群聊")
            $('#message').html("");
            var data = sessionStorage.getItem('gchat')
            $('#callUser').css('display','none')
            $('#message').html(data);
            return false;
        }
        //点击其他人私聊
        $(this).addClass('chatUser')
        $('#chatToUserName').text("正在与"+toname+"聊天...")
        MSG.toUser = toname
        MSG.type = 'chatTo'
        // chatDataSave()
        $('#message').html("")
        var data = sessionStorage.getItem(toname)
        $('#message').html(data);
        $('#callUser').css('display','block')
    })
    //发送消息
    function sendMsg() {
        console.log('function sendMsg run');
        $('#pic_file_info').text('')
        MSG.message = $('#content').val();
        // console.log(MSG)
        if (MSG.message == '' && !MSG.pic) return;
        // if(MSG.message.length < 1) return;
        ws.send(JSON.stringify(MSG))
        $('#content').val('')
        $('.emojionearea-editor').text("")
        MSG.pic = '';
    }
    //呼叫用户
    $('#callUser').click(function(){
        MSG.type = 'call'
        // console.log(MSG);
        ws.send(JSON.stringify(MSG))
        MSG.type = 'chatTo'
    })
    // 同意呼叫
    $('.accept').click(() => {
        MSG.toUser = $('.caller').text()
        var str = $('#allOnlinelist').find('p')
        str.each((i,item) => {
            $(item).text().indexOf(MSG.toUser) != -1 && $(item).click();
        });
        $('#notification').css('bottom', '-80px');
        clearInterval(interval0);
    })
    // 拒绝呼叫
    $('.reject').click(() => {
        
        $('#notification').css('bottom', '-80px');
        clearInterval(interval0);
    })
    //判断文件类型
    function  getFileType(filePath){
        var startIndex = filePath.lastIndexOf(".");
        if(startIndex != -1)
          return filePath.substring(startIndex+1, filePath.length).toLowerCase();
        else return "";
      }
}) //$

//聊天消息本地缓存
function chatDataSave(data,toUser){
    if(toUser == 'everyone'){
        var gchat = sessionStorage.getItem('gchat')
        var gChatNumber = sessionStorage.getItem(gChatNumber)
        if(!gchat){
            gchat = data
        }
        if(!gChatNumber){
            gChatNumber = 0
        }
        gChatNumber++
        gchat = gchat + data
        sessionStorage.setItem('gchat',gchat)
        sessionStorage.setItem('gChatNumber',gChatNumber)
    }else{
        var schat = sessionStorage.getItem(toUser)
        if(!schat){
            schat = data
        }
        schat = schat + data
        sessionStorage.setItem(toUser,schat)
    }
}




//接收服务端消息并显示
function creatChatDiv(data) {
    var info = '';
    var time = "<p class='time'>" + dateForm() + '</p>';
        switch (data.type) {
                case 'serverInformation':
                    info = data.message;
                    break;
                case 'chat':
                    info = "<span class='username'>" + data.name + '</span>:' + data.message;
                    break;
                default:
                    break;
            }
        info = '<p>' + info + '</p>';
        var div = $('<div></div>')
    div.append(info)
    div.append(time)
    var data = div[0]
    // console.log(data);
    
    return data
}

function dateForm() {
    var time = new Date()
    // console.log(time)
    var year = time.getFullYear()
    var month = (time.getMonth() + 1).toString()
    var date = time.getDate().toString()
    var hour = time.getHours().toString()
    var minute = time.getMinutes().toString()
    var second = time.getSeconds().toString()
    // console.log(typeof date)
    if (month.length < 2) {
        month = '0' + month;
    }
    if (date.length < 2) {
        date = '0' + date;
    }
    if (hour.length < 2) {
        hour = '0' + hour;
    }
    if (minute.length < 2) {
        minute = '0' + minute;
    }
    if (second.length < 2) {
        second = '0' + second;
    }
    return year + '-' + month + '-' + date + ' ' + hour + ':' + minute + ':' + second;
}