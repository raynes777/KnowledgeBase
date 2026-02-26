package com.ctd.xanadu.node.visitor;

import java.util.stream.Stream;

import com.ctd.xanadu.node.DocumentNode;
import com.ctd.xanadu.node.Node;
import com.ctd.xanadu.node.RootNode;

public class Flattener implements NodeVisitor<Stream<Node>> {

	@Override
	public Stream<Node> visitDocumentNode(DocumentNode n) {
		return Stream.concat(Stream.of(n),
				n.children().stream().flatMap(i -> i.accept(this)));
	}
	@Override
	public Stream<Node> visitRootNode(RootNode n) {
		return Stream.empty();
	}

	public static NodeVisitor<Stream<Node>> get(){
		return new Flattener();
	}

}
