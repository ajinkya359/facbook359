
create table friends
(
    id int
    auto_increment primary key,
     name varchar
    (255), 
     email varchar
    (255), 
     hash 
    varchar(255), 
     phone 
    char(10), 
     image
    varchar(255), 
     
);
create table friendreq(touser int ,fromuser int);
create table friends(friends int ,user int);
