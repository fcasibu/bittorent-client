# bittorent-client

Just learning by going through projects I'm interested about in [build-your-own-x](https://github.com/codecrafters-io/build-your-own-x)

[Guide here](https://allenkim67.github.io/programming/2016/05/04/how-to-make-your-own-bittorrent-client.html). I can't seem to make bencode libraries work so created one instead since it's more enjoyable that way.

Currently we can only download single files, not files in folders. This wouldn’t be hard to implement. You would just need to check the torrent object to see what the file structure looked like and where the start and end of each file was. In fact there are still many interesting problems you could work on to polish up this project. Here is a list:

- [ ] Add a graphic user interface
- [ ] Optimize for better download speeds and more efficient cpu usage. For example some clients calculate which pieces are the rarest and download those first.
- [ ] There’s also something called distributed hash tables which makes it possible to share torrents without the use of centralized trackers.
- [ ] You could write code to reconnect dropped connections
- [x] You could look for more peers periodically.
- [ ] You could support pausing and resuming downloads.
- [ ] You could support uploading since currently our client only downloads.
- [ ] Sometimes peers are unable to connect to each other because they are behind a NAT which gives a proxy ip. You could look into NAT traversal strategies.
